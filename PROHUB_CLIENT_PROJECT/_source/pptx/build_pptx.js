const pptxgen=require('pptxgenjs');const path=require('path');
const IMG=process.argv[3]||path.join(__dirname,'slides');
const OUT=process.argv[2];
const S=[
["Opportunity & audit","Cover — Better Days, served","Open with the promise: we're here to make Better Days the December night Abuja talks about first and buys tickets for early. The flyer on the right is our proposed key visual — we'll come back to it. Event is Saturday 5 December, 33 days from today."],
["Opportunity & audit","The opportunity","Cibus Musica already owns something no other Abuja concert has: food and music on the same plate. Three editions this year, a confirmed headliner in SoundBoi BME, a co-host audience through The Believers Music Concert, and four experience pillars in the logo itself. The opportunity is to stop promoting each edition as a new flyer and build one festival brand."],
["Opportunity & audit","Current brand audit","Walk through the five assets left to right. Lead with what works — the Calabar grid's conversion formats and the real SoundBoi portrait — before the scores. Key point: the Abuja assets score lowest on information and conversion readiness because venue, price and link are missing."],
["Opportunity & audit","What needs to change","Good instincts, no system. Keep the name, the logo and the conversion posts. Fix the shifting visual language and typography. Retire the cartoon illustration and collage clichés. And add what's missing: food, proof from Ikom, a conversion path, group selling and partner amplification."],
["Strategy","Strategic diagnosis","The problem isn't the design — it's that every edition starts from zero. Three problems: recognition (no system), desire (selling a flyer, not a night) and conversion (no path to purchase). In December, when every weekend competes for the same people, that's expensive."],
["Strategy","Strategic approach","Positioning: the December concert where the food is part of the line-up. Four phases over the 33 days — Serve, Prove, Order, Last orders — and we measure on tickets sold and check-ins, not likes."],
["Strategy","Audience","Five audiences, one night. The Plan-Makers matter most — they buy for the group. Fans come through the artist, Foodies through creators, the Believers community through the co-host, and Table hosts through direct sales."],
["Creative","Creative direction — Better Days are served","The campaign speaks the language of a kitchen. It comes from the brand's own name, so no competitor can copy it. Read down the vocabulary table: every phrase is also a call to action — 'Place your order' literally means buy a ticket."],
["Creative","Visual identity system","Menu modernism with heritage colours. Palette is rationalised from their own logo. Three typefaces with fixed jobs. The signature device is the plate-record — a vinyl on a dinner plate. Artists get a halftone duotone treatment so every name looks consistent whatever the photo quality."],
["Creative","Main event flyer","Explain the four-step read: the promise, the symbol, the menu, the order. Point out the venue slot updates on reveal day without a redesign. Label: proposed visual direction."],
["Creative","Alternative directions","Same idea, three moods. We recommend the night-time Place Setting. Alt A, the Order Docket, is the most shareable — 'Refund: all of 2026's bad days.' Alt B is the daylight editorial version for food content."],
["Creative","Artist, experience & ticket creative","'Now Serving Nº 01' is a repeatable artist format — every new name is the next order. 'What's on the menu' sells the night beyond the headliner. 'Place your order' shows tiers as a menu — prices are pending client confirmation."],
["Social","Social content strategy","Five pillars: Serve, Taste, Prove, Play, Order. The rule: no post goes out without a reason, a next step and a link. Cadence: one feed post and three to five stories a day, four short videos a week, WhatsApp twice a week."],
["Social","Seven-day launch calendar","Walk the arc left to right: Reset, Now Serving, Menu, Pick Your Plate, Ikom Got Served, Place Your Order, Tag Your Table. The hard sell lands on day six, after five days of building desire. Full captions are in the calendar PDF."],
["Social","Social media mockups","Show how the grid finally looks like one brand — night and paper tiles alternate for rhythm. The poll story and the artist Collab post are the two biggest reach drivers."],
["Social","Story designs","Four story templates: countdown with the Remind-me sticker, artist reveal, poll, and ticket with a link sticker. Each is composed for 9:16, not resized from the feed post."],
["Website","Website experience","Recommendation: a dedicated page at cibusmusica.com/abuja, not a new site. One job — get a visitor from curiosity to checkout. We've built a working responsive prototype, not just a picture."],
["Website","Ticket purchase & experience sections","Order in three taps, a sticky mobile ticket bar, and every visit tracked with pixels, UTMs and creator codes so we know which post sold which ticket. The page is a template — the next edition is a content swap."],
["Marketing","Digital marketing strategy","Each channel does the job it's best at: Instagram for discovery and proof, TikTok for reach, WhatsApp to convert, paid Meta to scale and retarget, creators for trust, vendors for free reach. Targets get set once capacity and budget are confirmed."],
["Marketing","Conversion & FOMO mechanics","Give people a reason to buy today, not on the day: published price steps, public 'Kitchen closed' stamps on sold-out tiers, table captains for groups, and the heaviest push in the 25–30 November pay-day window. All scarcity must be real."],
["Execution & next steps","Execution plan","Thirty-three days from yes to sold out. Key-visual approval within 48 hours of kick-off, campaign live Monday 9 November, landing page live Friday 13 November. Clarify the split: Prohub owns creative, media and reporting; Cibus Musica owns facts, approvals and access."],
["Execution & next steps","Why Prohub","With 33 days on the clock there's no room for a designer here, a marketer there and a developer somewhere else. One team, one system, one point of accountability — measured on tickets. Diagnose, Plan, Make, Measure."],
["Execution & next steps","Scope of engagement","Six modules — take all or start with one. Fees are quoted per module once scope is agreed; full deliverables are in the Scope & Execution Plan."],
["Execution & next steps","Next steps","Ask for the decision: an approval call this week, the fact sheet within 24 hours, and we go live Monday 9 November. Walk through the client checklist on the right — venue, prices and ticketing link are the most urgent."]
];
const pres=new pptxgen();pres.layout='LAYOUT_WIDE';
pres.title='Better Days, served — Prohub × Cibus Musica';pres.author='Prohub Creative Solutions';pres.company='Prohub Creative Solutions';pres.subject='Campaign proposal for Cibus Musica | Abuja — Better Days';
let cur=null;
S.forEach(([sec,title,notes],i)=>{
  if(sec!==cur){pres.addSection({title:sec});cur=sec;}
  const s=pres.addSlide({sectionTitle:sec});
  s.background={color:'0E0E10'};
  s.addImage({path:path.join(IMG,`slide_${String(i+1).padStart(2,'0')}.jpg`),x:0,y:0,w:13.333,h:7.5,altText:`Slide ${i+1}: ${title}`,objectName:`Slide ${i+1} — ${title}`});
  s.addNotes(`${title}\n\n${notes}`);
});
pres.writeFile({fileName:OUT}).then(f=>console.log('wrote',f));
