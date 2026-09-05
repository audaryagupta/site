// One-off content seed run by docker-entrypoint.sh on boot.
// - Inserts the six commissioned article drafts if their slug does not exist yet
//   (never overwrites, never publishes).
// - Normalises the brand spelling "Venturebuz" in stored settings.
import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const slugify = (s) =>
  s
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 80)
    .replace(/-[^-]*$/, (tail, i) => (i + tail.length >= 80 ? "" : tail));

const readingMinutes = (html) => {
  const words = html.replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
  return Math.max(1, Math.round(words / 220));
};

const a = (href, text) => `<a href="${href}" target="_blank" rel="noopener noreferrer">${text}</a>`;

const ft = (id, text) => a(`https://www.ft.com/content/${id}`, text);

const drafts = [
  {
    title: "The aviation economy: who actually makes money when a plane takes off",
    tags: ["Finance & Economics", "Business & Startups"],
    excerpt:
      "Airlines carry the risk, suppliers collect the rent. A plain explainer of how the money moves in aviation in a year when fuel has wrecked the forecasts.",
    seoTitle: "The aviation economy explained: airlines, fuel, backlogs and where the profit sits",
    seoDescription:
      "How the aviation economy really works in 2026: fuel shocks, aircraft backlogs, the engine shortage and why suppliers and lessors earn more than airlines.",
    html: `
<p>Every time a plane takes off, a long chain of businesses gets paid: the airport, the fuel supplier, the lessor who owns the aircraft, the engine maker who sells the spare parts, the caterer, the ground handler, the payments company that processed the ticket. The airline sits at the end of that chain and keeps whatever is left. In a good year that is a few per cent. In a year like this one, it can be nothing.</p>

<h2>The fuel shock</h2>
<p>Fuel is the single biggest reason airline profits swing so hard. This year the swing came from the Middle East. The war with Iran and the fight over the Strait of Hormuz pushed jet fuel prices up sharply, and the trade body IATA ${a("https://www.reuters.com/business/aerospace-defense/global-airlines-slash-2026-profit-forecast-fuel-shock-iran-war-2026-06-07/", "nearly halved its 2026 profit forecast for the industry")} in June. Before the war it had been expecting a record year of around $41bn in net profit.</p>
<p>The numbers at individual carriers show how thin the margin is. The FT reported that the four big US airlines ${ft("c425d77d-a467-4e93-a837-85b4858bca58", "faced roughly $280mn of extra fuel cost between them for every week prices stayed elevated")}. American Airlines ${a("https://www.reuters.com/business/american-airlines-trims-full-year-profit-target-weighed-by-higher-fuel-prices-2026-07-23/", "cut its outlook twice")} and warned it could end the year around breakeven despite record revenue. Lufthansa ${a("https://www.reuters.com/business/lufthansa-sets-2026-profit-outlook-range-after-q2-ebit-hit-by-fuel-costs-2026-08-04/", "warned profits could fall")} and its shares dropped more than 10 per cent in a day. In Europe the worry went beyond price: the FT reported that airports could face ${ft("801e46c7-cfb7-43c3-99bd-6a5ca971ceff", "systemic jet fuel shortages")} if the strait did not fully reopen.</p>
<p>Airlines can hedge, but ${a("https://www.reuters.com/business/energy/many-airlines-hit-hard-by-jet-fuel-price-swings-not-all-can-hedge-iata-says-2026-06-03/", "not all of them are in a position to")}, and hedges only delay the pain. The rest is passed to passengers through fares and route cuts.</p>

<h2>Not enough planes</h2>
<p>You would think a fuel shock would leave airlines with too many aircraft. The opposite is true. Airbus and Boeing cannot build planes fast enough. Airbus ended March with ${a("https://markets.ft.com/data/announce/detail?dockey=600-202604281145DGAP____ADHOC____adhoc_2317044_en-1", "a backlog of 9,037 commercial aircraft")}, roughly a decade of production at current rates, and it ${ft("3d39d36a-c951-471f-b735-17790fa69ea8", "only narrowly beat a delivery target it had already cut")} last year. The bottleneck is not the airframe. It is engines, castings and skilled labour. Airbus has openly ${ft("4e0a103e-94d7-49d1-a283-1f2485a0d7e8", "blamed Pratt &amp; Whitney")} for holding back A320 output.</p>
<p>The result is that old planes keep flying. That is good news for maintenance and repair shops, which the FT describes as ${ft("ca25c9af-f8a1-4ee4-b2ef-fbeb54a84589", "enjoying a boom")}, and for anyone who owns a spare engine. Engines have become so valuable that owners now ${ft("d97e30cf-ac15-40a6-a630-86a50745c28b", "lease out the engines rather than whole aircraft")}.</p>

<h2>Where the profit sits</h2>
<p>Put those two facts together and you get the real story of the aviation economy. The FT summed it up in one headline: ${ft("dcb0fd01-43c1-45a6-aeac-5951dd0c027b", "as airlines struggle, their suppliers are flying high")}. Engine makers earn most of their money on aftermarket parts, and a shortage of new aircraft means more hours on old engines. Lessors earn more when planes are scarce. Airports and fuel suppliers get paid whether or not the flight was profitable.</p>
<p>The airlines that do well are the ones that have moved away from selling seats as a commodity. Delta, for example, ${ft("d4e9b862-b933-4ff5-be1a-59961ccfe7ef", "expects earnings to jump on the back of a 'premium arms race'")}, meaning business cabins, loyalty schemes and credit-card partnerships. Those revenue lines are far less exposed to the fuel price than the economy cabin is.</p>

<h2>What to watch</h2>
<ul>
<li><strong>Fuel.</strong> Every dollar on the barrel flows almost straight through to airline margins. Watch the Hormuz shipping traffic before you watch airline results.</li>
<li><strong>Deliveries.</strong> If Airbus and Boeing finally get engines on time, the second-hand and leasing market softens and airlines recover pricing power. If they do not, suppliers keep winning.</li>
<li><strong>Premium mix.</strong> The gap between carriers that sell premium cabins and loyalty and carriers that only sell seats will widen.</li>
</ul>
<p>The lesson for anyone looking at the sector: the plane is the product, but the airline is not necessarily the business.</p>
`,
  },
  {
    title: "New York is still open: notes on a city doing business",
    tags: ["Business & Startups", "Finance & Economics"],
    excerpt:
      "Offices, bonuses, law firms, fintechs and a Knicks run. A walk through New York's business scene in 2026, minus the politics.",
    seoTitle: "New York business in 2026: offices, Wall Street, fintech and retail",
    seoDescription:
      "What is actually happening in New York's business scene: the office comeback, Wall Street pay, law-firm leasing, fintech valuations and Fifth Avenue retail.",
    html: `
<p>Every few years someone writes New York's obituary as a place to do business. The rent is too high, the talent is leaving for Miami or Austin, the towers are half empty. Then you look at the leasing data and the obituary looks premature. This is a field note, not a forecast. Here is what the city looks like from the business side in 2026.</p>

<h2>The offices filled up, from the top down</h2>
<p>The clearest signal is real estate. Midtown Manhattan's availability rate has been falling as large companies expand rather than shrink, and the FT reported that investors are ${ft("8d1c9978-353a-4a2b-81d3-0d4113ce0b85", "piling billions back into the New York office market")}. The recovery is uneven. It is led by what brokers call the luxury tier: new or fully renovated towers with gyms, terraces and good food. The FT described that segment as ${ft("699ca691-2fc0-467e-a79a-43f1f9fbdb90", "booming")}, driven by financial services, law and technology firms that want space nice enough to bring people back in.</p>
<p>Older buildings are a different story. Some owners have decided the maths no longer works and are ${ft("60a67e2b-8f2c-4ca5-af47-efba143b8236", "handing worn-out offices back to the bank")}. Others are converting them to flats. Both are signs of a market clearing, not collapsing. The FT's own conclusion after years of relocation headlines was blunt: the great Wall Street exit ${ft("5d2e6897-11e1-4427-a340-7900b0bc6558", "never quite happens")}, and Manhattan leasing has reached its strongest level since 2014.</p>

<h2>Lawyers and bankers are hiring space</h2>
<p>Law firms are among the biggest tenants. Reuters reported that US law-firm leasing ${a("https://www.reuters.com/legal/legalindustry/us-law-firm-leasing-jumped-17-first-half-report-says-2026-08-28/", "jumped 17 per cent in the first half of 2026")}, with New York at the centre. Big firms want trophy floors; Paul Weiss set the tone a few years ago by ${ft("f2849309-f490-47e8-abe6-2aa6bfcc69fc", "taking more than 18 floors of a Midtown tower")}.</p>
<p>Pay follows. The consultancy Johnson Associates estimated that Wall Street bonus pools would be ${ft("d7c1ed6c-7075-4184-aada-8a9cafbfe3f2", "15 to 25 per cent higher than the year before")}, though the money is not spread evenly across desks. Jefferies has even told its senior bankers they must ${ft("4a519aa5-cfa1-4637-9ee2-5ed58ef19a08", "collaborate to earn the biggest bonuses")}, which tells you the firms are competing for clients, not cutting.</p>

<h2>Fintech found its feet again</h2>
<p>The technology story in New York is finance-flavoured. Ramp, the corporate card and payments company based in the city, ${ft("458a96ba-e022-4b06-b028-b4bc41a969b6", "nearly doubled its valuation to $13bn")} as fintech recovered from a difficult stretch. New York fintechs have a structural advantage: the customers, banks and regulators they need are within a few subway stops.</p>

<h2>Fifth Avenue is being rebuilt, not abandoned</h2>
<p>Retail is where the mixed picture is most visible. Saks Global, owner of the Fifth Avenue flagship, has been through ${ft("a8ce5c1a-b6ca-47e4-817a-209dc260d04e", "a painful, debt-heavy unwinding")}. Kering, the owner of Gucci, has been ${ft("2d4148e1-6533-42ef-aae9-6f0a4f287a25", "in talks to sell a stake in its prime Fifth Avenue building")}. That sounds bad until you notice who is buying: private equity and sovereign money paying up for the best blocks in the world. Weak operators are leaving; the real estate itself is not getting cheaper.</p>

<h2>And then the Knicks</h2>
<p>Business is also mood. The Economist argued that the Knicks' playoff run ${a("https://www.economist.com/united-states/2026/06/11/the-knicks-represent-new-york-and-capitalism-at-its-best", "showed New York, and its version of capitalism, at its best")}: a city that spends when it is happy and fills its restaurants, bars and arenas. That kind of energy does not show up in a spreadsheet, but every shop owner in Midtown felt it.</p>

<h2>The short version</h2>
<p>New York's business scene in 2026 is a bifurcated one. Good buildings, good firms and good brands are doing very well. Tired buildings and over-leveraged retailers are being cleared out. That is roughly what a healthy market is supposed to do.</p>
`,
  },
  {
    title: "Global shipping in 2026: the boom nobody planned, and the automation that is coming anyway",
    tags: ["Business & Startups", "Technology"],
    excerpt:
      "Freight rates doubled for the wrong reasons, carriers are merging, and the next decade of shipping will be decided by software in ports, on bridges and in booking systems.",
    seoTitle: "Global shipping industry 2026: freight rates, Red Sea, consolidation and AI automation",
    seoDescription:
      "The state of container shipping in 2026 and what changes to expect: Suez and Red Sea routing, carrier consolidation, and AI automation in ports, fleets and freight.",
    html: `
<p>In February, Maersk was telling investors to brace for a bad year. Ships were returning to the Red Sea, the fleet had grown too fast, and Reuters reported that the company ${a("https://www.reuters.com/business/maersk-q4-meets-forecasts-falling-freight-rates-weigh-2026-profits-2026-02-05/", "expected earnings could halve in 2026")} as freight rates fell. DSV, the world's largest freight forwarder, ${a("https://www.reuters.com/business/dsv-eyes-lower-freight-rates-port-pressures-red-sea-routes-resume-2026-02-04/", "said the same thing")}.</p>
<p>By August, Maersk had ${a("https://www.reuters.com/business/container-shipping-group-maersk-q2-profit-beats-forecasts-raises-outlook-2026-08-13/", "raised its guidance for the second time")} and beaten profit forecasts. Nothing about the underlying business had improved. The world simply got more chaotic.</p>

<h2>Part one: where the industry is now</h2>
<h3>Rates went up for the wrong reasons</h3>
<p>Three things happened at once. The war with Iran sent fuel prices up and pushed importers to move goods early; Reuters reported the cost of a container from Asia to the US ${a("https://www.reuters.com/business/energy/iran-war-anxiety-sends-global-container-shipping-rates-soaring-2026-06-10/", "doubled from the start of the war")}. US retailers ${a("https://www.reuters.com/business/retail-consumer/us-retailers-frontload-china-orders-holiday-season-shipping-firms-say-2026-06-30/", "pulled forward their holiday orders")} to get ahead of new tariffs, and the FT noted rates ${a("https://www.ft.com/container-shipping", "reached their highest since the 2024 Red Sea crisis")}. And port congestion in the Middle East and Asia soaked up capacity. That early surge is ${a("https://www.reuters.com/business/early-surge-us-container-imports-coming-an-end-shippers-say-2026-08-07/", "now ending")}, which is why carriers are cautious about next year.</p>

<h3>The Red Sea is still not normal</h3>
<p>Carriers have been edging back through Suez. CMA CGM ${ft("7201f6b9-babc-46c5-8918-fe05c87039f4", "stepped up Red Sea journeys")} as Houthi tensions eased, but many owners ${ft("1f0977aa-4b71-4e73-bf36-bf306ef4bbbe", "kept sailing round the Cape")} because insurers and crews do not trust a ceasefire. Every ship that goes round Africa absorbs about two weeks of capacity, which quietly supports rates.</p>

<h3>The big lines are getting bigger</h3>
<p>Overcapacity is pushing consolidation. Hapag-Lloyd agreed to ${ft("2db23fd8-de86-4a70-81f0-c30d59e074db", "buy Israel's Zim for $4.2bn")}, and its alliance with Maersk has ${ft("c0fec644-a08d-46dc-ac14-9bf359af70ab", "reshaped the global alliance map")}. MSC, already the largest carrier, ${ft("c29a373e-4c31-4f48-ac7c-221f1d0652a7", "keeps growing on its own")}. Fewer, larger carriers means more pricing discipline in the downturns and more leverage over ports and shippers.</p>

<h2>Part two: what changes next</h2>
<p>The industry's response to all of this volatility is software. Three layers are being automated, and they are at very different stages.</p>

<h3>1. Ports, first and fastest</h3>
<p>Terminal automation is no longer experimental. COSCO Shipping Ports said in its interim results that it would ${a("https://markets.ft.com/data/announce/detail?dockey=600-202608281002PR_NEWS_USPRX____CN36020-1", "advance full-process automation and deepen AI across port operations")}. Investors are following: a new $200mn maritime fund pointed to ${a("https://markets.ft.com/data/announce/detail?dockey=600-202605260621BIZWIRE_USPRX____20260526_BW505205-1", "labour constraints and geopolitical disruption accelerating automation, AI and robotics")} at ports. Expect automated stacking cranes, AI-scheduled berths and predictive maintenance to become the default at new terminals within a few years. The friction is not technical. It is labour. The threatened US East Coast port strike ${ft("b2b1d44d-318b-4b3b-a901-453d52b1fa17", "was fundamentally about automation")}, and that argument is not finished.</p>

<h3>2. Ships, slowly</h3>
<p>Fully autonomous container ships are a long way off, but AI on board is arriving for narrow jobs. The FT reported that the industry is ${ft("8e9c70f1-af80-4e9b-8171-59b1ad54aaf6", "using AI to detect cargo fires")}, which hit a decade high as battery shipments grew. Route optimisation, fuel-burn modelling and weather routing are already standard on large fleets, and they matter more as fuel gets expensive and carriers try to hit emissions rules.</p>

<h3>3. The paperwork, where the money is</h3>
<p>The biggest efficiency gain is the least glamorous. Booking, customs, documentation and exception handling are still full of email and PDFs. Multinationals are ${ft("b7fafed2-9d00-49b0-a281-c1002b139865", "turning to generative AI to run supply chains")}, and forwarders like DSV are building the same tools to quote, book and reroute in minutes rather than days. When shippers ${a("https://www.reuters.com/business/energy/shippers-weigh-unusual-routes-high-air-cargo-rates-ocean-gridlock-persist-2026-04-10/", "start looking at unusual routes")} because the usual ones are jammed, the company with the best routing software wins the customer.</p>

<h2>What this means</h2>
<p>Shipping's next decade will not be decided by who has the biggest ships. It will be decided by who can reprice, reroute and re-document fastest when the next chokepoint closes. The carriers already know this. It is why Maersk's chief has been ${a("https://www.ft.com/container-shipping", "calling for an investment push")} rather than simply banking this year's windfall.</p>
`,
  },
  {
    title: "The fall of London, and why I think the crash is the opportunity",
    tags: ["Finance & Economics", "Personal Essays"],
    excerpt:
      "London is losing listings, capital and confidence. Here is why I think the moment everyone gives up on it is exactly the moment investors should not.",
    seoTitle: "The fall of London for business: why a crash could be good news for investors",
    seoDescription:
      "Opinion: London's decline as a business and listing centre is real. Audarya Gupta argues the eventual crash is where the positive reaction for investors begins.",
    html: `
<p><em>This is an opinion piece. It describes what I think might happen, not what will happen.</em></p>

<p>I have watched London lose things for a few years now. The Arm listing went to New York, and the FT reported that ${ft("40a0f9c1-3be1-4973-a473-3893a1675d28", "the UK regulator was blamed for it")}. CRH moved its primary listing to New York and then ${ft("235b9c0d-f1ff-49a5-a408-c915dc3327c1", "left London entirely")}. Wise, one of the UK's best technology companies, ${ft("b4d17f4e-e62a-4bb5-8d1e-b132251c3744", "won a shareholder vote to move its main listing to New York")}. Smurfit Westrock ${a("https://markets.ft.com/data/announce/detail?dockey=600-202605200630BIZWIRE_USPRX____20260520_BW081627-1", "announced it would delist from London")} in May; Ferguson ${a("https://markets.ft.com/data/announce/detail?dockey=600-202606160645BIZWIRE_USPRX____20260616_BW635604-1", "cancelled its secondary listing")} in June. The FT counted ${ft("73c3b11d-f78e-4a0f-a2fa-428a6dc7fc58", "88 companies leaving the main market in a single year against 18 joining")}, and called it ${ft("aef053ce-c94d-4a72-8dce-bdbf56dd67e1", "the biggest exodus since the financial crisis")}. Downing Street has been ${ft("c87970fb-9308-4425-ab4a-8919b0726eab", "calling in private equity bosses")} to talk about it, which is not what a confident capital does.</p>

<p>So yes, the fall is real. London is losing its position as the place where a serious company must be listed. The reasons are well documented: a smaller pool of domestic buyers after pension funds moved out of UK equities, a valuation gap with the US that boards find hard to justify to their shareholders, and a regulator that companies say is slow. Euronext's chief was happy to call it ${ft("4f075874-6e96-414e-b637-10d27dfd5782", "a London problem")}.</p>

<h2>Where I part ways with the gloom</h2>
<p>Here is the thing I keep coming back to. Markets do not bottom when problems get fixed. They bottom when everyone agrees the problems cannot be fixed. London is close to that point, and I think there is one more leg down before it gets there.</p>
<p>My view is that London goes through something that looks like a crash: a stretch where a few more household names leave, a big listing fails, the pound wobbles, and the commentary turns from worried to contemptuous. That is the painful part. But it is also the moment the reaction starts, and I think the reaction is positive for investors who are paying attention. Three reasons.</p>

<h3>1. The assets are already cheap, and getting cheaper does not make them worse</h3>
<p>The FT asked the obvious question years ago: ${ft("726a6188-f04c-40e4-b7d1-a055d75e772c", "if the UK market is cheap, why doesn't it go up?")} The honest answer is that there was no forced buyer. A crash changes that. Cheap stocks that fall further attract the buyers who do not care about sentiment: private equity, foreign acquirers, and the companies themselves through buybacks. The mining sector is a preview. London ${ft("1fb624db-8804-4ebf-a4e9-37569a435859", "has been losing its grip on mining listings")}, yet Glencore looked hard at moving and ${ft("9d252c78-a03d-439b-806e-7f78fef8b299", "decided to stay")} because a New York listing would not have delivered more value. Some of the exodus is fashion. Fashion reverses.</p>

<h3>2. Policy only moves under pressure</h3>
<p>The UK has known what it needs to do for years. It has been slow because the pain was gradual. Mansion House reforms have been ${ft("ee3a2917-3a25-42ea-ac80-8ae7cbe4f2b4", "criticised as delivering tiny gains")}, and ministers have had to ${ft("c4e04b84-f135-4021-8a5a-6723b339165d", "threaten legislation")} to get pension funds to buy British assets. A visible crash removes the option of doing this slowly. Stamp duty on shares, listing rules, pension mandates: the things that get argued about for a decade get done in a year when the alternative is humiliation. Investors who buy before the policy response, not after, capture it.</p>

<h3>3. The index is not the economy</h3>
<p>The FTSE 100 ${ft("86286e3f-f206-437a-a634-af630d616090", "crossed 10,000 for the first time")} at the start of this year after rising more than 20 per cent in 2025, and it has ${ft("3c34d50c-6f4f-4bb3-b96b-728b3cb1881b", "handled 2026 far better than the UK economy has")}. That is because its biggest members earn abroad in dollars and benefit from the same commodity and energy volatility that hurts British households. A crisis of confidence in London as a venue does not automatically mean a crisis in the earnings of the companies listed there. The gap between how a company is priced and how it is doing is where returns come from.</p>

<h2>What I would actually do</h2>
<p>I am not saying buy everything the day the headlines turn ugly. I am saying decide now what you would want to own if London got 20 per cent cheaper, because in that moment you will not be thinking clearly. Businesses with global earnings and a London-only discount. Owners of the infrastructure that does not leave: exchanges, clearing, property in the right postcodes. And, if the reforms land, the mid-caps that domestic pension money is finally forced to buy.</p>
<p>The FT ran a piece arguing ${ft("e1c4e384-728b-4845-bbb2-acaf41d75a0c", "the gloom about the London market is overdone")}. I would go one step further. The gloom is not yet overdone enough. When it is, that is the buy signal.</p>

<p><em>Nothing here is investment advice. I am describing a thesis, and I might be wrong about the timing, the depth, or both.</em></p>
`,
  },
  {
    title: "Ten jobs that will be much rarer by the end of 2026",
    tags: ["Technology", "Business & Startups"],
    excerpt:
      "Not a prophecy, a checklist. Ten roles where the data already shows AI and automation shrinking headcount, and what is replacing them.",
    seoTitle: "Jobs disappearing by end of 2026: ten roles AI is already shrinking",
    seoDescription:
      "Which jobs are disappearing by the end of 2026? A grounded list of ten roles being cut by AI and automation, with the evidence and the counter-arguments.",
    html: `
<p>People who say AI will destroy all the jobs are wrong. People who say it is not destroying any are also wrong. The FT put a number on it: more than ${ft("0dc14b44-96f6-4b1f-921a-8cba8030eafc", "180,000 corporate job losses have been linked to AI since May 2023, 112,000 of them in 2026 alone")}, according to the outplacement firm Challenger, Gray and Christmas. US technology companies have ${ft("96a33881-27fd-42cf-8cff-4cbc87fc835f", "cut nearly 140,000 jobs this year")} while spending record sums on AI. And the World Economic Forum's ${a("https://www.weforum.org/publications/the-future-of-jobs-report-2025/", "Future of Jobs Report")} expects the fastest-declining roles to be clerical and administrative.</p>
<p>So here is a list. Not jobs that will vanish to zero by December, but jobs where there will be clearly fewer people doing them by the end of 2026 than there were at the start of 2024. I have tried to stick to roles where the evidence is already in.</p>

<h2>1. Tier-one customer service agents</h2>
<p>This is the most visible case. Chatbots now handle the password resets, order tracking and refund requests that used to fill call centres. Sam Altman has said plainly that ${ft("c9f905a0-cbfc-4a0a-ac4f-0d68d0fc64aa", "AI would eliminate some job categories, such as customer service")}. The twist: Block, after using AI to cut thousands of roles, is ${ft("04a83e0d-0128-4f59-9835-cb434a4257ec", "running a pilot to rehire humans for customer service")}. The job that survives is the escalation specialist, not the first-line agent.</p>

<h2>2. Junior software developers doing routine coding</h2>
<p>Coding assistants have moved from autocomplete to writing whole features. The FT's analysis of ${ft("7325e967-5f4e-40b1-af3f-7d2351781843", "whether software engineers survive agentic AI")} found the profession being reshaped rather than erased, but the entry rung is the one being kicked out. As one FT piece put it, take coding away from a junior developer and ${ft("b69f8599-eaf1-477a-a5a8-60a715e56a04", "you are left with very little")}. Senior engineers who review, architect and debug are busier than ever.</p>

<h2>3. Data-entry and back-office processing clerks</h2>
<p>Invoice matching, form processing, claims intake. These were already being offshored; now they are being automated wherever they were offshored to. This is the WEF's fastest-declining category and the least controversial item on this list.</p>

<h2>4. Entry-level analysts in professional services</h2>
<p>The first two years of a consulting, accounting or banking career used to be spent building slides and models. That work is now largely done by tools, which is why the FT is writing about a ${ft("62e7cf87-1ebe-41fd-9d15-dd0a75ad4d86", "graduate 'jobpocalypse'")} and why PwC's UK graduate applications ${ft("915a32cf-d62d-4caf-b539-8525e52257ad", "jumped 35 per cent while places shrank")}. Consulting firms are even ${ft("7fd9c234-a92b-4ab2-ba1f-969cf9a23f52", "calling juniors back to the office")} because the human skills, not the technical ones, are what they now need to teach.</p>

<h2>5. Paralegals and document reviewers</h2>
<p>Contract review and discovery were the first legal tasks to be automated properly. The roles left are supervisory. The FT's Big Question series on ${ft("427a0f91-ea70-4ad8-aa33-993680aa5e7d", "office jobs in the age of AI")} singled out junior professional roles as most exposed.</p>

<h2>6. Copywriters for routine marketing</h2>
<p>Product descriptions, ad variants, SEO articles. The FT found agencies ${ft("9877ee0d-8c13-41b4-b102-9f2b280787ea", "worried about a real threat to junior creative jobs")} and about a flattening of creative quality. Senior creatives who set direction are fine. People who produced volume are not.</p>

<h2>7. Translators and subtitlers for standard content</h2>
<p>Machine translation is now good enough for manuals, support pages and most subtitling. Human translators remain for legal, literary and high-stakes work, but the volume market is gone.</p>

<h2>8. Recruitment coordinators and screeners</h2>
<p>CV screening, scheduling and first-round filtering are automated. Recruiters who close candidates still exist; the people who booked the interviews mostly do not.</p>

<h2>9. Bookkeepers at small firms</h2>
<p>Bank-feed categorisation, reconciliation and VAT returns now happen inside accounting software. Accountants who advise are busier; bookkeepers who key in transactions are being replaced by a subscription.</p>

<h2>10. Middle managers whose job was reporting</h2>
<p>The layer of management that existed to gather status, compile reports and pass them up is being flattened. The FT's coverage of a ${ft("2402d659-9bcf-4036-9593-ec69fc9c45ba", "white-collar recession")} notes the hiring slowdown is hitting exactly this cohort. Block's decision to cut ${ft("50b9952e-ec3b-4fae-874f-c5e8424fcb96", "nearly half its workforce")} was as much about layers as about tasks.</p>

<h2>The honest caveats</h2>
<p>Not all of this is AI. The FT is careful to point out that ${ft("99b6acb7-a079-4f57-a7bd-8317c1fbb728", "offshoring, post-Covid budget discipline and weak growth")} explain a lot of the entry-level squeeze. Some economists think the CEO claims are ${ft("c9f905a0-cbfc-4a0a-ac4f-0d68d0fc64aa", "exaggerated")}. And there is a counter-trend: the FT has argued that AI ${ft("6cb9570b-dccd-46f5-b42a-4d0b7b5de35a", "isn't destroying entry-level jobs so much as changing them")}, with some firms realising young staff bring AI fluency the older ones lack.</p>
<p>What I am confident of: by the end of 2026 the roles above will employ fewer people, the people who remain will be more senior, and the ladder into those professions will have lost its bottom rungs. That last part is the real problem, and nobody has solved it yet.</p>
`,
  },
  {
    title: "The private-credit boom, explained in ten questions",
    tags: ["Finance & Economics"],
    excerpt:
      "A $2tn market grew up outside the banks. Now investors want their money back. A plain-English primer on what private credit is, why it boomed, and where the risk sits.",
    seoTitle: "The private-credit boom explained: what it is, why it grew, where the risk is",
    seoDescription:
      "A Q&A primer on private credit in 2026: the $2tn non-bank lending market, the redemption wave at Blackstone, Blue Owl and Apollo, and whether it threatens the wider system.",
    html: `
<p>Private credit was the quiet success story of the last decade. In 2026 it stopped being quiet. Here are the questions I kept getting asked, with the answers as plainly as I can give them.</p>

<h2>1. What is private credit?</h2>
<p>Loans made by investment funds rather than banks, usually to mid-sized companies, often ones owned by private equity. The loans are not traded on a public market, hence "private". The Economist's definition is the simplest: ${a("https://www.economist.com/by-invitation/2026/06/01/the-pain-to-come-in-private-credit", "loans to private mid-size companies made by investment funds")}.</p>

<h2>2. How big is it?</h2>
<p>The IMF puts the global market at ${ft("bf3f3e70-e849-41db-9a29-f2e5ed988e97", "just over $2tn, mostly in the US")}, which makes it about the size of the high-yield bond market. The FT argues it is larger still once you count adjacent lending. It is also spreading into new areas: Apollo led a ${a("https://markets.ft.com/data/announce/full?dockey=1330-9733857en-7B51FPB9VS4KOH877FC9VH5H4K", "$35bn financing for Broadcom's AI chip platform")} this summer, the kind of deal that would once have been a bank syndicate.</p>

<h2>3. Why did it grow so fast?</h2>
<p>Two reasons. After 2008, regulation ${a("https://www.economist.com/briefing/2026/04/01/a-guide-to-the-private-credit-crisis", "pushed banks to take less risk")}, and the funds stepped into the gap. And investors wanted yield. Private credit offered 10 to 12 per cent returns with, on paper, very low volatility, because the loans were not marked to market every day. Pension funds, insurers and eventually wealthy retail investors piled in through vehicles that promised quarterly withdrawals.</p>

<h2>4. So what went wrong?</h2>
<p>The withdrawals. Blackstone's flagship $79bn fund ${ft("8d7a9c3d-8e1c-40be-915c-7118c4946468", "received $2.1bn of redemption requests in a single quarter")}. Blue Owl ${ft("cdca18df-473c-4c66-a6db-d9be32bf9d88", "halted redemptions at one fund")}, which spooked everyone. By the first quarter of this year investors were trying to pull ${ft("86b6581f-95c1-4843-83b1-7e0706092bf3", "more than $20bn from the largest interval funds and business development companies")}. Wealthy individuals, who had been the fastest-growing source of money, ${ft("ea11d307-73af-4403-840d-b47dffce9cd0", "started backing away")}.</p>

<h2>5. Why did they want out?</h2>
<p>Partly because the returns stopped looking special once interest rates settled. Partly because of software. A lot of private credit was lent to software companies on the theory that their subscription revenues were bulletproof. Then AI made investors doubt those companies' futures, and the FT reported that ${ft("346815bb-7dff-4c97-9568-7ab2432c661d", "investors dumped listed private credit funds over bad-loan fears and AI exposure")}. The Blue Owl tech fund was ${ft("4c75ea97-8411-445d-b1fd-393b2b4222f8", "particularly exposed")}.</p>

<h2>6. Are the loans actually going bad?</h2>
<p>Officially, not much. Fund managers say defaults are low and ${a("https://privatecredit.live.ft.com/", "the withdrawal caps show the system working as designed")}. The Economist is more sceptical: headline defaults are under 2 per cent, but ${a("https://www.economist.com/business/2026/03/15/trouble-is-brewing-among-americas-corporate-borrowers", "the true figure is much higher")} once you count borrowers who pay interest with more debt rather than cash. The FT also found that funds have been ${ft("c071fa65-5517-4224-90c9-d73718165367", "selling debt to themselves at a record rate")} to generate cash, which is legal but not reassuring.</p>

<h2>7. What is a "gate" and why does it matter?</h2>
<p>Most retail private-credit funds let you withdraw a few per cent of the fund each quarter. If more people ask, the fund pays out the cap and everyone else waits. That is a gate. It protects the fund from a fire sale, but it also tells investors their money is less liquid than they were led to believe. The FT called this ${ft("5ba631de-e609-4dc4-afd2-09bb71b7dd02", "private credit's structural problem")}: liquid promises on illiquid assets.</p>

<h2>8. Could this become a financial crisis?</h2>
<p>Opinions differ, which is itself informative. A study covered by the FT concluded private credit could ${ft("b943a9b4-0ef3-441a-91b6-6a83e7b54d48", "amplify the next financial crisis")}. The Bank of England has ${ft("31387dbd-6a86-4449-8ea1-4de0e8861615", "signed up Blackstone, Apollo and KKR to a stress test")}. Wall Street banks have started ${ft("80bfb1e5-35f9-4199-9845-adbbe4455e5a", "trading credit default swaps against the big private credit funds")}, which is how you know the market has decided the risk is real enough to price. The Economist's leader asked ${a("https://www.economist.com/leaders/2026/04/01/how-worried-should-you-be-about-private-credit", "how worried you should be")} and landed on: worried about the funds, less worried about the system, because the losses sit with investors who signed up for them rather than with depositors.</p>

<h2>9. Is anything being done to make it more liquid?</h2>
<p>A secondary market is developing, where investors sell their fund stakes to other funds at a discount. The Economist thinks ${a("https://www.economist.com/finance-and-economics/2026/04/09/can-the-secondary-market-allay-private-credit-fears", "it may help")}, partly because loans throw off interest and so are easier to value than private equity stakes. Firms like Partners Group insist they still expect ${a("https://markets.ft.com/data/announce/detail?dockey=600-202606040115DGAP____ADHOC____adhoc_2339378_en-1", "solid growth despite the redemption uncertainty")}.</p>

<h2>10. What should an ordinary investor take from this?</h2>
<p>Three things. If a product promises high yield, low volatility and quarterly liquidity at the same time, one of those three is not true. The low volatility in private credit came from not measuring it, not from not having it. And the money that flows out of private credit has to go somewhere; the funds that survive this with their gates intact and their loan books honest will be raising money again in two years, probably on better terms for the people who lend it.</p>
<p>The boom is not over. The easy part of it is.</p>
`,
  },
];

async function seedDrafts() {
  for (const d of drafts) {
    const slug = slugify(d.title);
    const existing = await prisma.article.findUnique({ where: { slug } });
    if (existing) continue;
    const tags = [];
    for (const name of d.tags) {
      const tag = await prisma.tag.upsert({
        where: { slug: slugify(name) },
        update: {},
        create: { name, slug: slugify(name) },
      });
      tags.push({ id: tag.id });
    }
    const contentHtml = d.html.trim();
    await prisma.article.create({
      data: {
        slug,
        title: d.title,
        excerpt: d.excerpt,
        contentHtml,
        status: "draft",
        seoTitle: d.seoTitle,
        seoDescription: d.seoDescription,
        readingMinutes: readingMinutes(contentHtml),
        tags: { connect: tags },
      },
    });
    console.log(`seeded draft: ${slug}`);
  }
}

async function fixBrandSpelling() {
  const rows = await prisma.setting.findMany();
  for (const row of rows) {
    if (!/VentureBuz/.test(row.value)) continue;
    await prisma.setting.update({
      where: { key: row.key },
      data: { value: row.value.replace(/VentureBuz/g, "Venturebuz") },
    });
    console.log(`fixed spelling in setting: ${row.key}`);
  }
}

try {
  await seedDrafts();
  await fixBrandSpelling();
} finally {
  await prisma.$disconnect();
}
