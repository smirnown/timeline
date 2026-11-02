import type { HistoricalEvent } from '@/components/timeline'

/**
 * Events of 1917 in Russia, condensed from "Timeline of the Russian Revolution
 * (1917)" by Brian Baggins, Soviet History Archive, marxists.org (CC BY-SA).
 */
export const revolution1917Source = {
  title: 'Timeline of the Russian Revolution (1917)',
  url: 'https://www.marxists.org/history/ussr/events/timeline/1917.htm',
  author: 'Brian Baggins',
  license: 'CC BY-SA',
  licenseUrl: 'https://www.marxists.org/admin/legal/cc/by-sa.htm',
}

const MIA = 'https://www.marxists.org'

const MONTHS = [
  'January',
  'February',
  'March',
  'April',
  'May',
  'June',
  'July',
  'August',
  'September',
  'October',
  'November',
  'December',
]
const SHORT = MONTHS.map((m) => m.slice(0, 3))

/** Russia used the Julian calendar until February 1918; in 1917 it ran 13 days behind. */
const JULIAN_OFFSET_DAYS = 13

function gregorian(monthIndex: number, day: number): string {
  const date = new Date(Date.UTC(1917, monthIndex, day + JULIAN_OFFSET_DAYS))
  return date.toISOString().slice(0, 10)
}

function daysInMonth(monthIndex: number): number {
  return new Date(Date.UTC(1917, monthIndex + 1, 0)).getUTCDate()
}

/**
 * Turns a date written on the source page (Julian calendar), such as
 * "February 23", "March 21-22", "July 26 - August 3" or "August", into
 * Gregorian start/end dates plus an "O.S." note with the original date.
 */
export function fromOldStyle(text: string): Pick<HistoricalEvent, 'start' | 'end' | 'dateNote'> {
  const match =
    /^(\w+)(?: (\d+))?(?:\s*-\s*(?:(\w+) )?(\d+))?$/.exec(text.trim()) ??
    raise(`Unrecognised date "${text}"`)
  const [, startMonthName, startDay, endMonthName, endDay] = match
  const startMonth = monthIndex(startMonthName!)
  const endMonth = endMonthName ? monthIndex(endMonthName) : startMonth

  if (!startDay) {
    // Month-only entries span the whole (Julian) month.
    return {
      start: gregorian(startMonth, 1),
      end: gregorian(startMonth, daysInMonth(startMonth)),
      dateNote: `O.S. ${MONTHS[startMonth]}`,
    }
  }
  const start = gregorian(startMonth, Number(startDay))
  if (!endDay) {
    return { start, end: start, dateNote: `O.S. ${SHORT[startMonth]} ${startDay}` }
  }
  const endLabel = endMonth === startMonth ? endDay : `${SHORT[endMonth]} ${endDay}`
  return {
    start,
    end: gregorian(endMonth, Number(endDay)),
    dateNote: `O.S. ${SHORT[startMonth]} ${startDay}–${endLabel}`,
  }
}

function monthIndex(name: string): number {
  const index = MONTHS.indexOf(name)
  return index === -1 ? raise(`Unknown month "${name}"`) : index
}

function raise(message: string): never {
  throw new Error(message)
}

function e(date: string, title: string, description: string, url: string | null = null) {
  return { ...fromOldStyle(date), title, description, url }
}

export const revolution1917: HistoricalEvent[] = [
  e(
    'January 1',
    'An army on the brink',
    'Troops hold Riga against a German offensive while morale collapses: 1.5 million soldiers deserted in 1916, and their families are going hungry.',
  ),
  e(
    'January 9',
    'Bloody Sunday anniversary strikes',
    '145,000 workers strike in Petrograd and 30,000 in Moscow, with one-day strikes in many other cities. Bolshevik membership reaches 24,000.',
    `${MIA}/glossary/events/b/l.htm#bloody-sunday`,
  ),
  e(
    'January 26',
    "Workers' Group arrested",
    'Secret police arrest the Workers’ Group of the War Industries Committee after it calls for a provisional government.',
    `${MIA}/glossary/orgs/w/a.htm#war-industries-committee`,
  ),
  e(
    'January 31',
    'Petrograd is starving',
    'The flour stockpile will last ten more days and meat has run out. Long food queues form in bitter cold.',
  ),
  e(
    'February 10',
    'Rodzianko warns the Tsar',
    'Mikhail Rodzianko warns Nicholas II of coming upheaval and urges him to strengthen the Duma. The Tsar ignores him.',
    `${MIA}/glossary/people/n/i.htm#nicholas-2`,
  ),
  e(
    'February 14',
    'Strikes as the Duma reopens',
    '90,000 workers from 58 factories strike. The Bolshevik Petrograd Committee calls on workers to overthrow the Tsar.',
  ),
  e(
    'February 22',
    'Tsar leaves for the front',
    'Nicholas II departs for General Headquarters in Mogilev. The Putilov Plant locks out its striking workers.',
  ),
  e(
    'February 23',
    'The February Revolution begins',
    'On International Women’s Day, women textile workers launch a mass strike. 128,000 workers demand bread and an end to the war.',
    `${MIA}/glossary/events/f/e.htm#february-1917`,
  ),
  e(
    'February 24',
    'The strike doubles',
    'Around 200,000 workers, nearly half of Petrograd’s industrial workforce, now demand an end to the autocracy and the war.',
  ),
  e(
    'February 25',
    'Clashes with the police',
    'Vyborg workers break into police stations and cut government phone lines. General Khabalov vows to ban all demonstrations.',
  ),
  e(
    'February 26',
    'Troops fire on strikers',
    'Soldiers kill 169 workers and injure over 1,000. A company of the Pavlovsky Regiment turns on the police in protest.',
  ),
  e(
    'February 27',
    'The garrison mutinies; Petrograd Soviet forms',
    '66,000 soldiers join the strikers and free political prisoners. The Petrograd Soviet meets, and the Duma forms a Provisional Committee.',
    `${MIA}/glossary/orgs/s/o.htm#soviets`,
  ),
  e(
    'February 28',
    "Tsar's ministers arrested",
    'Revolutionaries take Moscow and Kronstadt sailors mutiny. The Soviet publishes the first issue of Izvestia.',
    `${MIA}/glossary/periodicals/i/z.htm#izvestia`,
  ),
  e(
    'March 1',
    'Soviet Order No. 1',
    'Soldiers are to elect committees and take orders from the Soviet. The Soviet recognises the Duma but bars its members from the coming government.',
    `${MIA}/history/ussr/government/1917/03/01.htm`,
  ),
  e(
    'March 2',
    'Nicholas II abdicates',
    'The Tsar abdicates in favour of his brother Mikhail, who refuses the throne. The Provisional Government is formed.',
    `${MIA}/glossary/orgs/p/r.htm#provisional-government`,
  ),
  e(
    'March 3',
    'Arrest of the Tsar ordered',
    'The Petrograd Soviet’s Executive Committee orders the arrest of Nicholas II.',
  ),
  e(
    'March 5',
    'Pravda resumes',
    'The Bolshevik paper, shut down for opposing the war, publishes again.',
    `${MIA}/glossary/periodicals/p/r.htm#pravda`,
  ),
  e('March 6', 'Political amnesty', 'The Provisional Government frees all political prisoners.'),
  e(
    'March 8',
    'Contact Commission formed',
    'The Soviet sets up a body to deal with the Provisional Government, which refuses Finland’s demand for independence.',
    `${MIA}/glossary/orgs/c/o.htm#contact-commission`,
  ),
  e(
    'March 9',
    'USA recognises the new government',
    'The first country to do so. France, Britain and Italy follow once assured that Russia will stay in the war.',
  ),
  e(
    'March 12',
    'Stalin returns; death penalty repealed',
    'Stalin arrives in Petrograd from exile and soon joins Pravda’s editorial board.',
    `${MIA}/reference/archive/stalin/index.htm`,
  ),
  e(
    'March 14',
    "Soviet's appeal for peace",
    'The Petrograd Soviet calls on the peoples of the world for peace without annexations or indemnities.',
  ),
  e(
    'March 17',
    'Polish independence refused',
    'Poland appeals for independence; the Provisional Government says no.',
  ),
  e(
    'March 18',
    'Stalin joins the Soviet Executive',
    'Stalin becomes a member of the Executive Committee of the Petrograd Soviet.',
  ),
  e(
    'March 19',
    'Land reform refused',
    'Despite the food crisis, the government refuses agrarian reform and condemns peasant land seizures.',
  ),
  e(
    'March 20',
    'Religious and ethnic restrictions lifted',
    'Tsarist restrictions are abolished; non-Russian languages are allowed in private schools and records.',
  ),
  e(
    'March 21-22',
    "Lenin's Letters from Afar",
    'Lenin’s letters from exile in Switzerland are published, heavily abridged.',
    `${MIA}/archive/lenin/works/1917/lfafar/index.htm`,
  ),
  e(
    'March 27',
    'Trotsky leaves New York',
    'The government declares it fights only in defence of Russia, a formula the Soviet accepts.',
    `${MIA}/archive/trotsky/index.htm`,
  ),
  e(
    'March 31',
    'Plekhanov returns',
    'After nearly 40 years in exile, Plekhanov arrives in Petrograd, now supporting the war.',
    `${MIA}/archive/plekhanov/index.htm`,
  ),
  e(
    'April 3',
    'Lenin arrives in Petrograd',
    'Lenin, Zinoviev and other Bolsheviks return from Switzerland to a crowd of workers, soldiers and party members.',
    `${MIA}/archive/lenin/photo/1895-1917/1917-03.htm`,
  ),
  e(
    'April 4',
    'The April Theses',
    'Lenin sets out his programme. Trotsky, travelling home, is detained by the British in Canada.',
    `${MIA}/archive/lenin/works/1917/apr/04.htm`,
  ),
  e('April 12', 'Freedom of assembly', 'A new law allows freedom of meetings and unions.'),
  e(
    'April 18',
    "May Day; Miliukov's secret note",
    'Huge May Day rallies (May 1 by the Western calendar). Foreign Minister Miliukov secretly promises the Allies war to complete victory.',
    `${MIA}/glossary/events/m/a.htm#may-day`,
  ),
  e(
    'April 20',
    'The note leaks',
    'Armed soldiers demonstrate for two days. The Bolsheviks say Miliukov’s resignation is not enough: power must pass to the Soviets.',
    `${MIA}/archive/lenin/works/1917/apr/20f.htm`,
  ),
  e(
    'May 1',
    'Soviet backs a coalition',
    'Over Bolshevik objections, the Petrograd Soviet votes to join a coalition government. Miliukov resigns the next day.',
    `${MIA}/glossary/orgs/c/o.htm#coalition-provisional-government`,
  ),
  e('May 4', 'Trotsky arrives in Russia', 'Released by the British, Trotsky reaches Russia.'),
  e(
    'May 10',
    'Militia restricted',
    'The Soviet rules that only discharged and wounded soldiers may serve as militiamen. Lenin criticises the decision.',
    `${MIA}/archive/lenin/works/1917/may/10d.htm`,
  ),
  e(
    'May 17',
    'Kronstadt goes its own way',
    'The Kronstadt Soviet declares itself the sole governing power in Kronstadt.',
  ),
  e(
    'May 31',
    'Guchkov resigns',
    'War Minister Guchkov resigns after street protests and is replaced by Kerensky.',
    `${MIA}/glossary/people/g/u.htm#guchkov-alexander`,
  ),
  e(
    'June 3',
    'First All-Russian Congress of Soviets',
    'The congress backs ending the war but, over Bolshevik protests, supports the Provisional Government.',
    `${MIA}/glossary/events/a/arcs.htm#june-1917`,
  ),
  e(
    'June 5',
    'Finland claims sovereignty',
    'Finland’s parliament asserts sovereignty except in foreign and military affairs. Troops are sent and it votes to dissolve itself.',
  ),
  e(
    'June 10',
    'Ukraine proclaims independence; march banned',
    'The Congress of Soviets backs the Central Rada. A Bolshevik demonstration against the government is banned, and the party abides by the ban.',
    `${MIA}/glossary/events/j/u.htm#june-10-1917`,
  ),
  e(
    'June 11',
    'Mensheviks call a demonstration',
    'Mensheviks accuse the Bolsheviks of serving Germany, then win a Soviet vote to hold demonstrations on June 18.',
  ),
  e(
    'June 18',
    'Kerensky Offensive; mass anti-war march',
    'A doomed offensive leaves 150,000 dead. 400,000 march against the war across Russia, mostly under Bolshevik banners.',
    `${MIA}/archive/lenin/works/1917/jul/03.htm`,
  ),
  e(
    'June 21',
    'Putilov strike',
    'Putilov workers strike. The Bolsheviks urge restraint while hungry soldiers press them to overthrow the government.',
  ),
  e(
    'June 23',
    'Kronstadt anarchists’ ultimatum',
    'They demand the release of jailed Petrograd anarchists, threatening to free them by force.',
  ),
  e(
    'June 24',
    'Factory closures planned',
    'Izvestia reports plans to close Petrograd factories. The Oranienbaum garrisons declare support for Kronstadt.',
  ),
  e(
    'June 26',
    'Grenadier Guards join Kronstadt',
    'The regiment returns from the front and sides with the Kronstadt anarchists.',
  ),
  e(
    'July 1',
    'Machine-gunners march on Petrograd',
    'The 1st Machine Gun Regiment arrives from Oranienbaum and refuses to go home. Other regiments demand all power to the Soviets.',
  ),
  e(
    'July 3',
    'The July Days begin',
    'Machine-gunners ordered to the front march armed through Petrograd, joined by workers. The Bolsheviks back the march if it stays peaceful.',
  ),
  e(
    'July 4',
    '500,000 demonstrate',
    'A general strike grips Petrograd. Troops loyal to the government ambush the crowds; 400 are killed or wounded.',
  ),
  e(
    'July 5',
    'Crackdown on the Bolsheviks',
    'Pravda’s presses are wrecked, Bolshevik headquarters ransacked, and union and Soviet activists arrested.',
  ),
  e(
    'July 6',
    'Standoff at the Peter and Paul Fortress',
    'Stalin negotiates safe passage home for besieged Kronstadt sailors in return for disarming. The general strike ends.',
    `${MIA}/glossary/orgs/r/e.htm#red-guards`,
  ),
  e(
    'July 7',
    "Lenin's arrest ordered",
    'The government brands Lenin a German spy, blames the Bolsheviks for the uprising, and disbands the Petrograd garrison.',
    `${MIA}/archive/lenin/works/1917/jul/26a.htm`,
  ),
  e(
    'July 8',
    'Kerensky heads the government',
    'Lvov resigns. Kerensky promises a Constituent Assembly, an 8-hour day and land reform; none of it is delivered.',
    `${MIA}/glossary/orgs/c/o.htm#constituent-assembly`,
  ),
  e(
    'July 11',
    'Lenin goes into hiding',
    'Lenin goes underground to avoid arrest.',
    `${MIA}/archive/lenin/photo/1895-1917/1917-2.htm`,
  ),
  e(
    'July 12',
    'Drumhead trials restored',
    'Summary executions return at the front, radical ideas are censored, and many newspapers are closed.',
  ),
  e(
    'July 18',
    'Kornilov made Commander-in-Chief',
    'General Lavr Kornilov takes supreme command of the armed forces.',
    `${MIA}/glossary/people/k/o.htm#kornilov`,
  ),
  e(
    'July 24',
    'Second Coalition Government',
    'Kerensky forms a new government with the Mensheviks, Cadets and SRs.',
    `${MIA}/glossary/orgs/c/a.htm#cadets`,
  ),
  e(
    'July 26 - August 3',
    'Sixth Bolshevik Party Congress',
    'Representing 240,000 members, the congress concludes a peaceful revolution is now impossible. Stalin reports in Lenin’s absence.',
    `${MIA}/glossary/events/r/rsdlp.htm#july-august-1917`,
  ),
  e(
    'August',
    'Economic collapse',
    '568 enterprises have closed since March. Prices are up 248% on 1913 and real wages down 57%. Peasants seize estates in 440 incidents.',
  ),
  e(
    'August 3',
    'Stalin elected to the Central Committee',
    'Stalin joins the Bolshevik Central Committee.',
  ),
  e(
    'August 12-15',
    'Moscow State Conference',
    'The government holds a conference in Moscow; 400,000 workers stage a one-day strike against it.',
    `${MIA}/archive/trotsky/1930/hrr/ch30.htm`,
  ),
  e(
    'August 14',
    'Kornilov demands a free hand',
    'At the conference, Kornilov warns Riga and Petrograd will fall unless he is given dictatorial powers.',
  ),
  e(
    'August 18',
    'Soviet votes to end the death penalty',
    'The Petrograd Soviet votes 900 to 4 to abolish it; the government complies four days later.',
  ),
  e(
    'August 19',
    'Kornilov asks to move his army',
    'Kerensky refuses Kornilov’s request to redeploy his army to Petrograd.',
  ),
  e(
    'August 21',
    'Riga falls',
    'The army retreats without a fight and the Germans occupy Riga. Kornilov plans a military dictatorship without Kerensky.',
  ),
  e(
    'August 22',
    'Kerensky asks for cavalry',
    'Kerensky asks Kornilov to send a cavalry corps to Petrograd to impose martial law.',
  ),
  e(
    'August 25',
    'Kornilov agrees, on his terms',
    'Kornilov will send the cavalry, and offers to put Kerensky “under his personal protection”. Kerensky wavers.',
  ),
  e(
    'August 26',
    'Kerensky turns on Kornilov',
    'The Cadets leave the government, which agrees with the big landlords to double the price of grain.',
  ),
  e(
    'August 27',
    'The Kornilov affair',
    'Kornilov denounces the government and sends three cavalry divisions on Petrograd. Kerensky declares him a traitor; the Bolsheviks arm workers.',
  ),
  e(
    'August 28',
    "Kornilov's troops won over",
    'Railway workers delay his trains and agitators win over his Cossacks. The “Savage Division” raises a red flag and arrests its staff.',
  ),
  e(
    'August 29',
    'Red Guards mobilise',
    '40,000 armed workers organise across Petrograd. Railway workers tear up tracks, and the Kronstadt and Vyborg garrisons mutiny.',
  ),
  e('August 30', 'Kornilov defeated', 'The Soviet announces that Kornilov’s army has collapsed.'),
  e(
    'September 1',
    'Petrograd Soviet swings to the Bolsheviks',
    'It backs the Bolsheviks 279 to 115, and 126 local Soviets call for Soviet power. Kerensky declares a republic and arrests Kornilov.',
  ),
  e(
    'September 2',
    'Finnish Soviets vote for Soviet power',
    'A joint session of Soviets in Finland votes 700 to 13 for a Soviet government.',
  ),
  e(
    'September 4',
    'Trotsky released',
    'Trotsky and other Bolshevik leaders are freed under public pressure.',
  ),
  e(
    'September 5',
    'Moscow Soviet backs Soviet power',
    'The vote is 355 to 254. The Siberian Soviets in Krasnoyarsk pledge support for the Bolsheviks.',
  ),
  e(
    'September 8',
    'Baltic Fleet rejects the government',
    'Baltic sailors will no longer obey the Provisional Government. The Kiev Soviet votes for Soviet power.',
  ),
  e(
    'September 9',
    'Petrograd Soviet reaffirms its vote',
    'Despite a Menshevik and SR attempt to reverse it, the Soviet backs Soviet power 519 to 414.',
  ),
  e(
    'September 12',
    'The State and Revolution',
    'Lenin publishes Lessons of the Revolution and completes The State and Revolution.',
    `${MIA}/archive/lenin/works/1917/staterev/index.htm`,
  ),
  e(
    'September 14',
    '“The Bolsheviks Must Assume Power”',
    'Lenin finishes The Impending Catastrophe and How to Combat It, and urges the Central Committee to take power.',
    `${MIA}/archive/lenin/works/1917/sep/14.htm`,
  ),
  e(
    'September 14-22',
    'Democratic Conference',
    'The conference rejects a new coalition, so a hand-picked Pre-parliament is created to approve one.',
  ),
  e(
    'September 18',
    'Tashkent Soviet crushed',
    'Troops retake Tashkent from its Soviet, prompting a week-long general strike. The Baltic Fleet defies an order to dissolve its committee.',
  ),
  e(
    'September 23',
    'Bolshevik Constituent Assembly list',
    'The Central Committee approves its candidates, including Lenin and Stalin.',
  ),
  e(
    'September 25',
    'Trotsky chairs the Petrograd Soviet',
    'The last coalition government meets amid protests from the Soviets.',
  ),
  e(
    'October',
    'Mutiny at the front',
    'Trade unions number nearly 2 million. Russian and German soldiers fraternise, and units mutiny to elect their own officers.',
  ),
  e(
    'October 5',
    'Bolsheviks vote to boycott the Pre-parliament',
    'Only Kamenev votes to take part.',
  ),
  e(
    'October 6',
    "Soldiers' Soviet breaks away",
    'The Petrograd Soldiers’ Soviet stops reporting to the Provisional Government.',
  ),
  e(
    'October 7',
    'Trotsky walks out of the Pre-parliament',
    'The Bolsheviks withdraw on its first day. The remaining delegates fail to agree on the war.',
  ),
  e(
    'October 10',
    'Central Committee votes for insurrection',
    'Lenin, secretly back in Petrograd, carries the vote over Kamenev and Zinoviev’s opposition. The Politburo is created.',
    `${MIA}/archive/lenin/works/1917/oct/08.htm`,
  ),
  e(
    'October 12',
    'Military Revolutionary Committee',
    'The Petrograd Soviet creates the committee that will lead the insurrection.',
  ),
  e(
    'October 14',
    '“Can the Bolsheviks Retain State Power?”',
    'Lenin answers his Menshevik and SR critics.',
    `${MIA}/archive/lenin/works/1917/oct/01.htm`,
  ),
  e(
    'October 18',
    'Kamenev and Zinoviev go public',
    'They reveal the insurrection plan in a Menshevik paper. Lenin demands their expulsion.',
    `${MIA}/archive/lenin/works/1917/oct/19.htm`,
  ),
  e(
    'October 19',
    'Kerensky threatens Ukraine and the fleet',
    'Kerensky moves against the Rada and the Baltic Fleet. Factory committees declare for all power to the Soviets.',
  ),
  e(
    'October 20',
    'War Minister urges peace',
    'Verkhovsky tells the Pre-parliament Russia must make peace at once. He is ridiculed and sent on leave.',
  ),
  e(
    'October 23',
    'Revolutionary Decree No. 1',
    'After weeks of agitation across the country, the Soviets take control of hiring and firing.',
  ),
  e(
    'October 24',
    'The October Revolution begins',
    'The government moves on the Bolshevik press and Smolny. Red Guards seize the Neva bridges and key points; Lenin takes command at Smolny.',
    `${MIA}/glossary/events/o/c.htm#october-revolution`,
  ),
  e(
    'October 25',
    'Second Congress of Soviets opens',
    'Red Guards hold the stations, State Bank and telephone exchange, and proclaim victory. Fighting breaks out in Moscow. Kerensky flees.',
    `${MIA}/glossary/events/a/arcs.htm#october-1917`,
  ),
  e(
    'October 26',
    'Winter Palace taken; Decrees on Peace and Land',
    'The Congress issues the Decrees on Peace and Land and forms a new government, which also suppresses hostile newspapers.',
    `${MIA}/archive/lenin/works/1917/oct/25-26/26b.htm`,
  ),
  e(
    'October 27',
    'Krasnov and Kerensky advance',
    'Cossacks take Gatchina and Tsarskoe Selo. Soviet power is established in Minsk, Kazan, Samara and other cities.',
  ),
  e(
    'October 29',
    'Junker revolt; railwaymen’s ultimatum',
    'A cadets’ rising in Petrograd is crushed. The railway union demands a coalition of all socialist parties.',
  ),
  e(
    'October 31',
    'Baku goes Soviet; Krasnov repulsed',
    'Soviets now hold 17 provincial capitals. Red Guards retake the Pulkovo Hills outside Petrograd.',
  ),
  e(
    'November 1',
    'Krasnov captured',
    'Soviet power wins in Tashkent. Krasnov is taken prisoner, but Kerensky escapes.',
  ),
  e(
    'November 2',
    'Rights of the Peoples of Russia',
    'The nations of the former empire are given the right to secede. Frunze leads reinforcements to Moscow.',
    `${MIA}/history/ussr/government/1917/11/02.htm`,
  ),
  e(
    'November 3',
    'Moscow secured',
    'The Kremlin is taken. Kamenev, Zinoviev and others leave the party after Lenin’s ultimatum; Sverdlov replaces Kamenev.',
    `${MIA}/archive/lenin/works/1917/nov/03.htm`,
  ),
  e(
    'November 5',
    'Lenin proclaims victory',
    '“Remember that now you yourselves are at the helm of state.”',
    `${MIA}/archive/lenin/works/1917/nov/05.htm`,
  ),
  e(
    'November 9',
    'Dukhonin dismissed',
    'The Commander-in-Chief refuses to seek an armistice and is replaced by Ensign Krylenko.',
    `${MIA}/archive/lenin/works/1917/nov/09.htm`,
  ),
  e(
    'November 18',
    'Soviet power in Vladivostok',
    'A Soviet government is established in Vladivostok.',
  ),
  e(
    'November 20',
    'Rada declares independence',
    'The Ukrainian Rada declares an independent state. Red Guards defeat Dukhonin at Mogilev.',
  ),
  e(
    'November 21',
    'Right of recall',
    'A decree lets citizens recall elected officials.',
    `${MIA}/archive/lenin/works/1917/nov/19.htm`,
  ),
  e(
    'November 23',
    'Officials’ pay capped',
    'A decree limits the salaries of high-paid officials.',
    `${MIA}/archive/lenin/works/1917/nov/18b.htm`,
  ),
  e(
    'November 26',
    'Peace talks at Brest-Litovsk',
    'The Soviet government opens talks with the Central Powers.',
    `${MIA}/glossary/events/b/r.htm#brest-litovsk-treaty`,
  ),
  e(
    'November 28',
    'Cadet leaders arrested',
    'Soviets hold 28 provincial capitals. Railway workers win an 8-hour day and the Church loses its monopoly on education.',
    `${MIA}/archive/lenin/works/1917/nov/28.htm`,
  ),
  e(
    'December 3',
    'Ultimatum to the Rada',
    'The Council of People’s Commissars recognises Ukraine’s right to secede, but demands the Rada let Ukrainian Soviets meet.',
    `${MIA}/archive/lenin/works/1917/dec/03.htm`,
  ),
  e(
    'December 6',
    'Right to divorce',
    'Russian women win the right to divorce.',
    `${MIA}/archive/newsholme/1933/red-medicine/ch11.htm`,
  ),
  e(
    'December 7',
    'The Cheka is founded',
    'Dzerzhinsky chairs the new commission against counter-revolution and sabotage.',
    `${MIA}/archive/lenin/works/1917/dec/07.htm`,
  ),
  e(
    'December 14',
    'Banks nationalised',
    'The nationalisation of the banks is proclaimed.',
    `${MIA}/archive/lenin/works/1917/dec/14.htm`,
  ),
  e(
    'December 15',
    'Armistice offered',
    'The Soviet government offers an armistice to the Central Powers. A congress on demobilising the army opens.',
  ),
  e(
    'December 17',
    'Constituent Assembly results',
    'Of 36 million votes, the SRs win 58% and the Bolsheviks 25%, though the Bolsheviks carry the cities, army and fleet.',
  ),
  e(
    'December 19',
    'Finland declares independence',
    'The Council of People’s Commissars opens short-lived talks with the Ukrainian Rada.',
    `${MIA}/archive/lenin/works/1917/dec/19a.htm`,
  ),
  e(
    'December 25',
    'Soviet Ukraine proclaimed',
    'The First All-Ukraine Congress of Soviets declares a Soviet republic and disowns the Rada.',
  ),
  e(
    'December 31',
    'Finnish independence recognised',
    'The Soviet government accepts Finland’s independence.',
  ),
]
