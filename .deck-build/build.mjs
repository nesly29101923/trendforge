import fs from 'node:fs/promises';
import { Presentation, PresentationFile } from '@oai/artifact-tool';
import { finalizePresentation } from '/Users/omersinaceylan/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations/container_tools/artifact_tool_utils.mjs';

const root = '/Users/omersinaceylan/Documents/nesliomer/trendforge';
const skill = '/Users/omersinaceylan/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations';
const p = Presentation.create({slideSize:{width:1280,height:720}});
const C = {dark:'#191D19', paper:'#F3F1E8', lime:'#D0F66B', muted:'#AFB6AA', ink:'#252B23', gray:'#60665B'};
const font = 'Helvetica Neue';
function text(s, value, x,y,w,h,size,color=C.ink,bold=false) {
 const sh=s.shapes.add({geometry:'textbox',position:{left:x,top:y,width:w,height:h},fill:'none',line:{fill:'none',width:0}});
 sh.text=value;
 sh.text.style={typeface:font,fontSize:size,color,bold,insets:0,autoFit:'none',verticalAlignment:'top',wrap:'none'};
 return sh;
}
function slide(bg,num,dark=false){
 const s=p.slides.add();s.background.fill=bg;
 text(s,'TrendForge',64,40,220,32,24,dark?C.paper:C.ink,true);
 text(s,`0${num}`,1166,42,50,26,18,dark?C.muted:C.gray);
 return s;
}

// 01: Problem and one sourced piece of market evidence.
{
 const s=slide(C.dark,1,true);
 text(s,'A product to sell.\nNo idea what\nto film.',64,157,730,258,70,C.paper,true);
 text(s,'Small business owners need customers.\nCreating social content takes time\nand marketing knowledge.',67,467,710,126,29,C.muted);
 text(s,'52%',867,172,350,151,126,C.lime,true);
 text(s,'of early-stage businesses\nsurveyed named customer\nacquisition their top\nmarketing challenge.',876,343,340,160,27,C.paper);
 text(s,'Constant Contact, 2025 · 1,600 businesses · US, UK, Australia & Canada',67,659,1130,24,17,C.muted);
 s.speakerNotes.text='Small business owners may have a good product and a phone, but choosing and adapting a trend requires marketing judgment. The survey establishes the customer-acquisition problem; it does not prove demand for TrendForge. Source: https://www.constantcontact.com/news/2025-03-04-new-wave-of-smbs-is-social-first-technology-driven-and-highly-adaptable . Published March 4, 2025. Survey of 1,600 businesses operating for five years or less across the US, UK, Australia and Canada. 52% identified customer acquisition as their top marketing challenge.';
}

// 02: A concrete use case, explicitly illustrative.
{
 const s=slide(C.paper,2);
 const img=await fs.readFile(`${root}/.deck-build/filming.png`);
 s.images.add({blob:img.buffer.slice(img.byteOffset,img.byteOffset+img.byteLength),contentType:'image/png',alt:'Illustrative scene of a jewelry seller filming a necklace with a phone',fit:'cover',position:{left:768,top:0,width:512,height:720}});
 text(s,'A new product.\nA video to make.',64,155,675,180,68,C.ink,true);
 text(s,'A jewelry seller wants to promote\na new necklace on social media.',67,360,645,94,30,C.gray);
 text(s,'“What should I film\nto bring people to my store?”',67,493,651,102,34,C.ink,true);
 text(s,'Illustrative use case · AI-generated image',67,659,650,24,17,C.gray);
 s.speakerNotes.text='This is a use case, not a customer success story. A jewelry seller has a new necklace and wants store visits. They need a relevant format and practical filming instructions. The same workflow could apply to other small businesses marketing a physical product. The image was generated for illustration using OpenAI image generation and is not evidence of a customer or a real event.';
}

// 03: Flat typography conveys the workflow without invented product screenshots.
{
 const s=slide(C.lime,3);
 text(s,'A trend becomes\na filming plan.',64,145,1130,170,68,C.ink,true);
 const rows=[
  ['01','Choose a trend','See its hook, timing and fit for your product.'],
  ['02','Get a filming plan','Add your product. Get shots and on-screen text.'],
  ['03','Record and improve','Film on your phone. Upload a draft for feedback.'],
 ];
 rows.forEach((r,i)=>{const y=356+i*91;text(s,r[0],68,y+3,65,35,24,C.gray);text(s,r[1],155,y,455,45,33,C.ink,true);text(s,r[2],624,y+5,590,65,25,C.ink);});
 text(s,'AI analyzes the reference. You make the video.',67,659,1120,30,23,C.ink);
 s.speakerNotes.text='Demo flow: select a trend, inspect its analysis, enter a product brief, generate a shot-by-shot filming guide, and upload a draft for specific feedback. Keep the demo focused on the human filming workflow. AI writes the plan, but generating a video is not required. Product capabilities are supported by the project implementation in lib/analysis.ts and lib/viral.ts; do not imply that suggestions guarantee sales or virality. During a live demo, show one useful instruction and one concrete draft improvement.';
}

// 04: Outcomes remain a clearly identified hypothesis.
{
 const s=slide(C.dark,4,true);
 text(s,'More sales from\nless content effort.',64,145,1150,173,72,C.paper,true);
 text(s,'Our hypothesis: a clearer plan helps owners create\ncontent faster and bring more buyers to their store.',67,340,1135,84,30,C.muted);
 const metrics=[['Less time','Minutes per video'],['More visits','Tracked store visits'],['More sales','Orders from those visits']];
 metrics.forEach((r,i)=>{const x=67+i*395;text(s,r[0],x,481,385,58,43,C.lime,true);text(s,r[1],x,553,385,44,26,C.paper);});
 text(s,'Pilot: compare against the owner’s usual content · Revenue impact is not yet validated',67,659,1140,26,18,C.muted);
 s.speakerNotes.text='The business goal is to help small business owners generate more value from the time they spend creating content. We have not validated a revenue uplift. In a pilot, compare multiple comparable posts with and without TrendForge, recording time spent, tracked store visits and attributed orders. Use tracked links or codes; attributed sales alone do not establish causal lift. Longer term, account for contribution margin and content/tool costs. Do not use the prototype expected-views estimate or score-after-fixes as evidence of financial performance. Close by returning to the use case: an owner should leave knowing what to film and how to improve it.';
}

for(const [i,s] of p.slides.items.entries()){
 const img=await p.export({slide:s,format:'png',scale:1});
 await fs.writeFile(`${root}/.deck-build/slide-${i+1}.png`,new Uint8Array(await img.arrayBuffer()));
}
const candidatePath=`${root}/.deck-build/candidate.pptx`;
await (await PresentationFile.exportPptx(p)).save(candidatePath);
const result=await finalizePresentation({
 workspaceDir:root,candidatePath,finalPath:`${root}/output/deck/TrendForge-Pitch.pptx`,
 pythonExecutable:'/Users/omersinaceylan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',
 integrityValidatorPath:`${skill}/container_tools/inspect_presentation_package_integrity.py`,
 layoutValidatorPath:`${skill}/container_tools/inspect_presentation_layout_geometry.py`,
 layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],
 requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],
 fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,
 receiptPath:`${root}/.deck-build/validation.json`,
});
console.log(JSON.stringify(result));
