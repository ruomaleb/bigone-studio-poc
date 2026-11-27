// Only the selected working proof is loaded. Product pages and thumbnails remain lightweight.
let key='', resource=null, generation=0;
async function load(plan,api){
  let source,bytes;
  if(plan.attachment){
    const f=await api('/file',{id:plan.attachment.id});
    bytes=Uint8Array.from(atob(f.content),c=>c.charCodeAt(0));
    if(f.mime.startsWith('image/'))return {image:URL.createObjectURL(new Blob([bytes],{type:f.mime}))};
  }else{
    source=plan.file;
    if(/\.(png|jpe?g|webp)(?:[?#]|$)/i.test(source))return {image:source};
  }
  const lib=await import('../assets/pdfjs/pdf.min.mjs');
  lib.GlobalWorkerOptions.workerSrc=new URL('../assets/pdfjs/pdf.worker.min.mjs',import.meta.url).href;
  return {pdf:await lib.getDocument({...(bytes?{data:bytes}:{url:source}),isEvalSupported:false,useSystemFonts:true}).promise};
}
export async function mountProof(plan,page,paper,api){
  const slot=paper?.querySelector('.ed-file-layer');if(!slot)return;
  const id=plan.attachment?.id || plan.file, gen=++generation;
  try{
    if(key!==id){
      resource?.then(old=>{old.pdf?.destroy();if(old.image?.startsWith('blob:'))URL.revokeObjectURL(old.image);}).catch(()=>{});
      key=id;resource=load(plan,api);
    }
    const file=await resource;
    if(gen!==generation||!slot.isConnected)return;
    let view,w,h;
    if(file.image){
      view=new Image();view.alt='BAT · page '+page;view.src=file.image;await view.decode();w=view.naturalWidth;h=view.naturalHeight;
    }else{
      const pdfPage=await file.pdf.getPage(page),original=pdfPage.getViewport({scale:1}),viewport=pdfPage.getViewport({scale:Math.min(2,1300/Math.max(original.width,original.height))});
      view=document.createElement('canvas');view.width=viewport.width;view.height=viewport.height;
      await pdfPage.render({canvas:view,viewport}).promise;w=original.width;h=original.height;
    }
    if(gen!==generation||!slot.isConnected)return;
    paper.style.aspectRatio=w+'/'+h;paper.style.width='min(calc(96cqw * var(--ed-zoom,1)),calc('+(96*w/h)+'cqh * var(--ed-zoom,1)))';
    slot.replaceChildren(view);paper.dataset.proofReady='true';
  }catch{
    key='';if(!slot.isConnected)return;slot.textContent='Aperçu du fichier indisponible pour cette page.';paper.dataset.proofReady='false';
  }
}
