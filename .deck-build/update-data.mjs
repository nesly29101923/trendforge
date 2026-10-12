import fs from 'node:fs/promises';
import {FileBlob, PresentationFile} from '@oai/artifact-tool';
import {finalizePresentation} from '/Users/omersinaceylan/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations/container_tools/artifact_tool_utils.mjs';
const root='/Users/omersinaceylan/Documents/nesliomer/trendforge';
const skill='/Users/omersinaceylan/.codex/plugins/cache/openai-primary-runtime/presentations/26.1011.11113/skills/presentations';
const p=await PresentationFile.importPptx(await FileBlob.load(`${root}/output/deck/TrendForge-Pitch.pptx`));
const C={dark:'#191D19',paper:'#F3F1E8',lime:'#D0F66B',muted:'#AFB6AA',ink:'#252B23',gray:'#60665B'};
const font='Helvetica Neue';
function style(sh,value,x,y,w,h,size,color,bold=false){sh.text=value;sh.position={left:x,top:y,width:w,height:h};sh.text.style={typeface:font,fontSize:size,color,bold,insets:0,autoFit:'none',verticalAlignment:'top',wrap:'none'};return sh;}
function add(s,...args){return style(s.shapes.add({geometry:'textbox',fill:'none',line:{fill:'none',width:0}}),...args);}
function edit(id,...args){return style(p.resolve(id),...args);}
for(const [i,s] of p.slides.items.entries()) {const b=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(`${root}/.deck-build/before-data-${i+1}.png`,new Uint8Array(await b.arrayBuffer()));}

// Keep the established composition and add a quantified time constraint.
edit('sh/7qp4be9c','42% have less than one hour a day\nto spend on marketing.²',67,493,715,95,30,C.muted);
edit('sh/ts7md4r2','of early-stage businesses\nsurveyed named customer\nacquisition their top\nmarketing challenge.¹',876,343,340,168,27,C.paper);
edit('sh/sryl4zqx','Constant Contact, 2025 · ¹ 1,600 early-stage businesses · ² 2,500 SMB decision-makers\nSeparate surveys across the US, UK, Australia and Canada',67,647,1135,46,16,C.muted);
p.resolve('sl/y90nupkv').speakerNotes.append('\nAdditional source: https://www.constantcontact.com/news/2025-09-03-the-state-of-small-business-marketing-effort-is-up-while-confidence-has-declined . Published September 3, 2025; survey conducted June 2025 by Ascend2 Research, 2,500 small business decision-makers across Australia, Canada, the United Kingdom and the United States. 42% reported less than one hour per day to spend on marketing. This is all marketing time, not video-production time. Do not combine denominators across the two surveys.');

// Preserve the use case and link it to current consumer discovery data.
edit('sh/x4r21kru','49%',67,476,180,89,73,C.ink,true);
add(p.resolve('sl/hwbqtkby'),'of consumers surveyed use social media\nto discover new small businesses.¹',258,490,472,80,25,C.gray);
edit('sh/w3i1sfa9','¹ Constant Contact, June 2026 · 2,255 consumers\nIllustrative use case · AI-generated image',67,644,680,49,16,C.gray);
p.resolve('sl/hwbqtkby').speakerNotes.append('\nSource: https://www.constantcontact.com/news/2026-06-10-the-rise-of-the-smb-creator-how-small-businesses-are-leveraging-social-media-and-ai-to-capture-consumer-attention . Published June 10, 2026. Consumer sample: 2,255 across US, UK, Canada and Australia/New Zealand. 49% use social media to discover new small businesses. This is discovery behavior, not a purchase rate or a claim that TrendForge increases sales.');

// Make the improvement advice concrete in the existing workflow.
edit('sh/n6ls3alk','Get a shot sequence and a clear offer on screen.',624,452,590,65,25,C.ink);
edit('sh/943mhgre','Check pacing, product clarity and the next action.',624,543,590,65,25,C.ink);
p.resolve('sl/ofy9wn61').speakerNotes.append('\nSpecific improvement points to demonstrate: varied product shots instead of one continuous sales pitch; readable offer or call-to-action text; specific draft feedback on pacing and brand integration. These correspond to the existing film-guide and draft-review capabilities, not a new claim of automated sales tracking.');

// Rework the final slide into evidence and measurable improvement points.
edit('sh/0ba143al','Clearer videos.\nA stronger path to sales.',64,128,1150,153,64,C.paper,true);
edit('sh/rm1k7yt4','Historical ecommerce ad benchmarks from TikTok',67,305,1135,46,28,C.muted);
edit('sh/ql8jytsj','+38%',67,376,410,101,82,C.lime,true);
edit('sh/doj29oba','Reported conversion lift with varied scenes\nvs. one continuous product sales shot.',67,477,525,80,25,C.paper);
edit('sh/sna103ap','+80%',664,376,410,101,82,C.lime,true);
edit('sh/3ihk3et8','Reported conversion lift with offer / CTA text\nvs. videos without text or a CTA.',664,477,550,80,25,C.paper);
edit('sh/ih8ju9sn','Improve: shot variety + visible offer + clear next action',67,578,1145,37,27,C.paper,true);
edit('sh/kbm987y5','Pilot measures: minutes per video · tracked store visits · attributed orders',67,623,1145,32,22,C.muted);
edit('sh/5cva1cfq','Source: TikTok, Dec 2021 · Paid-ad associations, not additive or guaranteed · Not TrendForge results',67,677,1150,23,16,C.muted);
p.resolve('sl/jyx0ra1s').speakerNotes.text='Business goal: more sales from less content effort. External evidence supports concrete creative improvements, not a claim of proven TrendForge lift. Source: https://ads.tiktok.com/business/en-US/blog/creative-that-drives-conversions . Published December 21, 2021. TikTok used a machine-learning model to analyze thousands of auction-platform ads. Ecommerce section: varied scenes were associated with 38% conversion lift compared with one person selling a product in one continuous shot. Ecommerce videos using captions or on-screen text clearly displaying an offer or CTA showed 80% conversion lift compared with videos without text or CTA. Historical platform-reported paid-ad associations; not randomized causal estimates, not organic-post forecasts, and not revenue-growth percentages. These lifts must not be summed or multiplied. The article gives no exact sample count or confidence intervals. TrendForge can support shot planning and on-screen text, but its revenue impact remains unvalidated. Proposed pilot: compare multiple comparable usual and assisted posts for each business, controlling or recording offer, posting time, spend and audience. Record time spent; use campaign links/codes and store analytics for visits and orders. Sales tracking is a pilot measurement plan, not an implemented TrendForge capability. Consider contribution margin and content/tool costs before claiming profit gains.';

for(const [i,s] of p.slides.items.entries()) {const b=await p.export({slide:s,format:'png',scale:1});await fs.writeFile(`${root}/.deck-build/data-slide-${i+1}.png`,new Uint8Array(await b.arrayBuffer()));}
const candidatePath=`${root}/.deck-build/data-candidate.pptx`;
await (await PresentationFile.exportPptx(p)).save(candidatePath);
const result=await finalizePresentation({workspaceDir:root,candidatePath,finalPath:`${root}/output/deck/TrendForge-Pitch-Data.pptx`,pythonExecutable:'/Users/omersinaceylan/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3',integrityValidatorPath:`${skill}/container_tools/inspect_presentation_package_integrity.py`,layoutValidatorPath:`${skill}/container_tools/inspect_presentation_layout_geometry.py`,layoutArgs:['--expected-slide-size-emu','12192000,6858000','--validate-bullet-geometry','--validate-heading-fit'],requiredNativeTableOwnerSlides:[],requiredNativeChartOwnerSlides:[],fontPolicy:{basis:'design',families:[font]},verifyArtifactToolImport:true,receiptPath:`${root}/.deck-build/data-validation.json`});
console.log(JSON.stringify({finalPath:result.finalPath,integrity:result.packageIntegrity.status,layout:result.presentationLayout.findingCount}));
