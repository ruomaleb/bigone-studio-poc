import {formats} from '../server/kit.mjs';

const palettes={sauge:['#dbe3ce','#213725'],sable:['#f2dfc6','#432f23'],lavande:['#e4dbf6','#38294c']};
export async function drawOutput(canvas,spec) {
  const {width,height}=formats[spec.format], vertical=spec.format==='vertical';
  const source=new Image();
  source.crossOrigin='anonymous';
  source.src=new URL(spec.image,import.meta.url).href;
  await Promise.all([source.decode(),document.fonts.load('700 100px Diagramm'),document.fonts.load('700 48px Gilmer')]);
  canvas.width=width;canvas.height=height;
  const g=canvas.getContext('2d'),[bg,ink]=palettes[spec.theme];
  g.fillStyle=bg;g.fillRect(0,0,width,height);
  const x=vertical?0:480,y=0,w=width-x,h=vertical?1040:height;
  const scale=Math.max(w/source.width,h/source.height);
  g.drawImage(source,(source.width-w/scale)/2,(source.height-h/scale)/2,w/scale,h/scale,x,y,w,h);
  const left=vertical?76:44,top=vertical?h+98:118,available=vertical?width-2*left:x-2*left;
  g.fillStyle=ink;
  function line(text,font,size,baseline) {
    g.font='700 '+size+'px '+font;
    while(g.measureText(text).width>available && size>14) g.font='700 '+(--size)+'px '+font;
    g.fillText(text,left,baseline,available);
  }
  line(spec.brand.toLocaleUpperCase('fr-FR'),'Gilmer',48,top);
  const words=spec.title.trim().split(/\s+/),name=words.pop();
  line(words.join(' '),'Gilmer',46,vertical?top+205:top+320);
  line(name,'Diagramm',vertical?190:138,vertical?top+380:top+473);
  line((spec.cents/100).toLocaleString('fr-FR',{minimumFractionDigits:2,maximumFractionDigits:2})+' €','Diagramm',vertical?163:98,height-90);
  return canvas;
}
// RGB PNG, with horizontal prediction and deflate. The canvas has an opaque background.
export async function encodeOutput(canvas) {
  const w=canvas.width,h=canvas.height,rgba=canvas.getContext('2d').getImageData(0,0,w,h).data;
  const scan=new Uint8Array((3*w+1)*h);
  for(let y=0;y<h;y++){
    let k=y*(3*w+1);scan[k++]=1;
    for(let x=0;x<w;x++){
      const pos=4*(y*w+x);
      for(let ch=0;ch<3;ch++)scan[k++]=rgba[pos+ch]-(x?rgba[pos+ch-4]:0);
    }
  }
  const compressed=new Uint8Array(await new Response(new Blob([scan]).stream().pipeThrough(new CompressionStream('deflate'))).arrayBuffer());
  const signature=Uint8Array.of(137,80,78,71,13,10,26,10),head=new Uint8Array(13),view=new DataView(head.buffer);
  view.setUint32(0,w);view.setUint32(4,h);head[8]=8;head[9]=2;
  function chunk(type,data){
    const bytes=new Uint8Array(data.length+12),d=new DataView(bytes.buffer);
    d.setUint32(0,data.length);bytes.set(new TextEncoder().encode(type),4);bytes.set(data,8);
    d.setUint32(bytes.length-4,checksum(bytes.subarray(4,-4)));return bytes;
  }
  const blob=new Blob([signature,chunk('IHDR',head),chunk('IDAT',compressed),chunk('IEND',new Uint8Array())],{type:'image/png'});
  return new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(reader.result.split(',')[1]);reader.onerror=()=>reject(Error('PNG indisponible.'));reader.readAsDataURL(blob);});
}
function checksum(bytes){
  let crc=-1;
  for(const byte of bytes){
    crc^=byte;
    for(let i=0;i<8;i++)crc=(crc>>>1)^((crc&1)?0xedb88320:0);
  }
  return (crc^-1)>>>0;
}
export const fromBase64=content=>Uint8Array.from(atob(content),c=>c.charCodeAt(0));
export function downloadBlob(blob,name) {
  const url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download=name;a.click();setTimeout(()=>URL.revokeObjectURL(url),5000);
}
// ZIP with stored entries. PNG data is already compressed.
export function archive(entries) {
  const encoder=new TextEncoder(),local=[],directory=[];
  let offset=0,dirSize=0;
  function header(bytes,signature) {
    const data=new Uint8Array(bytes),view=new DataView(data.buffer);
    view.setUint32(0,signature,true);return {data,view};
  }
  for(const entry of entries) {
    const name=encoder.encode(entry.name),size=entry.bytes.length;
    const crc=checksum(entry.bytes);
    const l=header(30,0x04034b50),c=header(46,0x02014b50);
    l.view.setUint16(4,20,true);c.view.setUint16(4,20,true);c.view.setUint16(6,20,true);
    for(const [view,start] of [[l.view,6],[c.view,8]]) {
      view.setUint16(start,0x800,true);view.setUint16(start+6,33,true);view.setUint32(start+8,crc,true);
      view.setUint32(start+12,size,true);view.setUint32(start+16,size,true);view.setUint16(start+20,name.length,true);
    }
    c.view.setUint32(42,offset,true);
    local.push(l.data,name,entry.bytes);directory.push(c.data,name);
    offset+=30+name.length+size;dirSize+=46+name.length;
  }
  const end=header(22,0x06054b50);
  end.view.setUint16(8,entries.length,true);end.view.setUint16(10,entries.length,true);
  end.view.setUint32(12,dirSize,true);end.view.setUint32(16,offset,true);
  return new Blob([...local,...directory,end.data],{type:'application/zip'});
}
