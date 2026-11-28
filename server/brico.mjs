// Commercial references already present in the Studio PIM, keyed to the supplied catalogue.
export const bricoId = 'bd-2704-deco';
export const isBricoDemo = s => s.op.scenario === 'brico-demo';
export const catalogueId = 'bd-ecatalogue';
export const bonialId='bd-bonial';
export const bricoBonial=s=>s.flows.find(f=>f.id===bonialId)||s.flows.find(f=>/\bbonial\b/i.test(f.name));
export function missingBonialUnit(s,flow) {
  if((s.op.id!==bricoId && !isBricoDemo(s)) || !flow || bricoBonial(s)?.id!==flow.id)return null;
  return s.products.find(p=>p.id==='bd-03' && p.versions.includes(flow.v) && !p.pack?.trim());
}
export const catalogueUrl = 'https://ruomaleb.github.io/bigone-studio-poc/assets/brico-deco/catalogue.pdf';
export const bricoVersions = [
  {id:'V1', name:'Version classique', desc:'Les 17 luminaires et miroirs des pages 2 à 5.'},
  {id:'V2', name:'Version large', desc:'Les 21 références du catalogue Brico-déco.'},
  {id:'V3', name:'Version restreinte', desc:'Les quatre ampoules LED de la page 5.'}
];
const oldBricoNames = {V1:'Luminaires et miroirs', V2:'Catalogue intégral', V3:'Ampoules LED'};
export const usesBricoVersions = s => s.op.id === bricoId || isBricoDemo(s);
export function updateBricoVersionNames(s) {
  for (const version of s.config.versions) {
    const reference = bricoVersions.find(v => v.id === version.id);
    if (reference && version.name === oldBricoNames[version.id] && version.desc === reference.desc) version.name = reference.name;
  }
}
export function displayVersions(s) {
  const versions = s.config.versions;
  return usesBricoVersions(s) ? ['V3', 'V1', 'V2'].flatMap(id => versions.filter(v => v.id === id)) : versions;
}
export function versionLabel(s, id) {
  const version = s.config.versions.find(v => v.id === id);
  return usesBricoVersions(s) && version ? version.name : id;
}
export function versionOptions(s) {
  return displayVersions(s).map(v => [v.id, usesBricoVersions(s) ? v.name : v.id + ' · ' + v.name]);
}
const references = [
  ["bd-01","SUSPENSION ZÉLIE",39.99,2,"Forme conique en métal filaire peint et cannage. Pavillon en métal assorti. Coloris noir. Ø40 cm. H. 8,5 cm Fonctionne avec une ampoule de type E27, non fournie"],
  ["bd-02","LAMPADAIRE ZÉLIE",56.99,2,"Base ronde en métal. Abat-jour conique en métal filaire peint et cannage naturel. Coloris noir. L. 30 cm x P. 35 cm x H. 160,5 cm Fonctionne avec une ampoule de type E27, non fournie"],
  ["bd-03","LAMPE À POSER GAIA",12.5,2,"Lampe en céramique mat. Abat-jour cylindre en lin HOME Ø 16 cm. H. 26 cm Fonctionne avec une ampoule de type E14. d'une puissance de 40W non fournie Existe en blanc ou terracotta"],
  ["bd-04","SUSPENSION SABAJOU",39.99,2,"Empilement conique en tissu imprimé et raphia. Coloris : sabajou/naturel. Ø 38 cm. H. 21 cm Fonctionne avec une ampoule de type E27, non fournie"],
  ["bd-05","MIROIR À SUSPENDRE BÉA",22.5,2,"En plastique Dim. 30 x 120 cm. Existe en blanc, noir ou argent"],
  ["bd-06","MIROIR NINA",19.99,3,"En métal. Ø40 cm"],
  ["bd-07","SUSPENSION CONRAD",55,3,"Suspension réglette 3 lumières style industriel. Base rectangulaire en bois certifié FSC. Fonctionne avec une ampoule de type E27, d'une puissance de 60W non fournie."],
  ["bd-08","SUSPENSION FORME NASSE",35.99,3,"En cordelette de papier tressée à la main. Ø 38 cm. H. 36 cm Fonctionne avec une ampoule de type E27, d'une puissance de 15W non fournie Existe en applique à 24,90 €"],
  ["bd-09","SPOT HUDSON",72.5,3,"Spot 3 ampoules base carrée en métal effet bois. Abat-jour en métal peint. Têtes orientables. Coloris : noir mat/bois foncé. L. 68 cm x P. 21 cm x H. 18 cm Fonctionne avec des ampoules de type E27, d'une puissance de 15W non fournies. Existe en 1 spot à 24,90€ et en 2 spots à 46,90€"],
  ["bd-10","SPOT THÉO",22.5,3,"Spot 3 ampoules base ronde avec cache douille en métal peint effet bois. Têtes orientables. Coloris chêne/noir mat. IP20 Fonctionne avec des ampoules de type GU10, d'une puissance de 5W non fournies. Existe en 1 spot à 9,50€ et en 2 spots à 18,90€"],
  ["bd-11","LAMPE À POSER VÉNUS",74.99,4,"Lampe en effet crépi. Abat-jour cylindrique en raphia bordé noir. Ø 30 cm. H. 64,5 cm Fonctionne avec une ampoule de type E27, d'une puissance de 40W non fournie"],
  ["bd-12","SUSPENSION KAMI",14.99,4,"Suspension en bambou naturel Ø 30 cm. H. 27,5 cm Fonctionne avec une ampoule de type E27 non fournie."],
  ["bd-13","SUSPENSION BANA",124.5,4,"Suspension 3 lumières forme tambour. Ø78 cm. Fonctionne avec 3 ampoules de type E27 non fournies"],
  ["bd-14","MIROIR LORELY",19.99,4,"En bois. Dim. 35 x 125 cm Existe en blanc ou argent"],
  ["bd-15","LAMPE BALLON",20.5,5,"Ø22 cm Puissance max: 7W Flux lumineux: 600 lumens LED intégrées"],
  ["bd-16","PLAFONNIER BALLON",18.99,5,"Puissance max: 12W Flux lumineux: 1000 lumens LED intégrées"],
  ["bd-17","PLAFONNIER MAIA",44.99,5,"Ø 33 cm Multicolore Puissance max: 10W Flux lumineux: 1100 lumens LED intégrées"],
  ["bd-18","AMPOULE LED ÉDITION FANTASTIC COLORS",11.99,5,"Puissance max: 5W Flux lumineux: 470 lumens Culot E27 Verre clair"],
  ["bd-19","AMPOULE LED INNER GLOW ÉDITION",14.99,5,"Puissance max: 3,5W Flux lumineux: 80 lumens Culot E27 Verre fumé"],
  ["bd-20","AMPOULE LED INNER GLOW ÉDITION HELIX",14.5,5,"Puissance max: 3,5W Flux lumineux: 180 lumens Culot E27 Doré"],
  ["bd-21","AMPOULE LED",24.99,5,"1879 ÉDITION Puissance max: 4W Flux lumineux: 130 lumens Culot E27 Verre fumé"]
];
export function bricoProducts() {
  return references.map(([id, name, price, page, description], i) => ({
    id, name, price, page, description, brand:'Nanotera', rayon:'Bricolage', pack:'', note:'',
    versions: i < 17 ? ['V1','V2'] : ['V2','V3']
  }));
}
