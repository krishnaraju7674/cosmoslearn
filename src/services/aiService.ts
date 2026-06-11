import { QuizQuestion, NarrationCache } from '@/utils/types';
import { planetMap } from '@/utils/planetData';

const API_KEY = import.meta.env.VITE_CLAUDE_API_KEY;
const API_URL = 'https://api.anthropic.com/v1/messages';
const MODEL = import.meta.env.VITE_CLAUDE_MODEL || 'claude-sonnet-4-20250514';

const narrationCache: NarrationCache = {};
const CACHE_DURATION = 24 * 60 * 60 * 1000; // 24 hours

function getCacheKey(planetId: string): string {
  return `narration:${planetId}`;
}

function getCachedNarration(planetId: string): string | null {
  const key = getCacheKey(planetId);
  const cached = narrationCache[key];
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.text;
  }
  return null;
}

function setCachedNarration(planetId: string, text: string): void {
  const key = getCacheKey(planetId);
  narrationCache[key] = { text, timestamp: Date.now() };
}

// Fallback narrations when API is unavailable
const fallbackNarrations: Record<string, string> = {
  sun: "Behold the Sun, a magnificent nuclear furnace that has illuminated our solar system for 4.6 billion years. Containing 99.86% of all mass in our cosmic neighborhood, this yellow dwarf star transforms hydrogen into helium through nuclear fusion, releasing energy that sustains all life on Earth. Its surface simmers at 5,500°C while solar flares erupt with the power of billions of nuclear bombs.",
  mercury: "Welcome to Mercury, the smallest planet and the closest world to the Sun. This barren, crater-scarred world experiences the most extreme temperature swings in the solar system—from a scorching 430°C in daylight to a freezing -180°C at night. Despite being nearest to the Sun, it's not the hottest planet—that title belongs to Venus, thanks to its runaway greenhouse effect.",
  venus: "Venus is Earth's twin in size but completely alien in nature. Shrouded by thick clouds of sulfuric acid, this world experiences a runaway greenhouse effect that makes it the hottest planet in the solar system at 462°C. Strangest of all, Venus rotates backwards, and a single day on Venus is actually longer than its entire year!",
  earth: "Welcome home to Earth, the third rock from the Sun and the only known oasis of life in the universe. With 71% of its surface covered by liquid water, a protective magnetic field, and a breathable atmosphere, this pale blue dot is a rare gem in the cosmos. Our planet orbits the Sun at 107,000 km per hour, carrying us through space on a journey around the galaxy.",
  mars: "Mars, the Red Planet, gets its color from iron oxide—rust—covering its surface. Home to Olympus Mons, the tallest volcano in the solar system at 21.9 kilometers high, this dusty world once had flowing rivers and possibly a vast ocean. Today, robotic explorers like Perseverance and Ingenuity are uncovering Mars' ancient secrets, searching for signs of past life.",
  jupiter: "Jupiter is the heavyweight champion of our solar system, a gas giant so massive it could fit over 1,300 Earths inside it. Its most famous feature, the Great Red Spot, is a storm larger than our entire planet that has been raging for at least 400 years. With 95 known moons, including volcanic Io and icy Europa, Jupiter is a mini solar system unto itself.",
  saturn: "Saturn is the crown jewel of the solar system, wrapped in a spectacular ring system that spans 282,000 kilometers yet is only 10 meters thick. This gas giant is so light it would actually float in water. With at least 146 known moons, including Titan with its methane lakes, Saturn continues to astonish us with its beauty and mystery.",
  uranus: "Uranus is the oddball of the solar system, rolling through space on its side with an extreme 98-degree axial tilt. This ice giant's blue-green color comes from methane in its atmosphere absorbing red light. Discovered by William Herschel in 1781, Uranus was the first planet found using a telescope, opening a new era of astronomical discovery.",
  neptune: "Neptune, the most distant planet in our solar system, is a dark, cold world whipped by the fastest winds ever recorded—reaching an incredible 2,100 kilometers per hour. This vivid blue ice giant was the first planet predicted mathematically before it was ever observed. With its Great Dark Spot storms and 16 known moons, Neptune remains one of the most mysterious worlds in our cosmic neighborhood.",
};

export async function fetchNarration(
  planetId: string,
  experienceLevel: string = 'beginner',
  onStream?: (chunk: string) => void
): Promise<string> {
  // Check cache first
  const cached = getCachedNarration(planetId);
  if (cached) {
    if (onStream) {
      // Simulate streaming from cache
      const words = cached.split(' ');
      for (let i = 0; i < words.length; i++) {
        onStream(words[i] + ' ');
        await new Promise((r) => setTimeout(r, 40));
      }
    }
    return cached;
  }

  // If no API key, use fallback
  if (!API_KEY || API_KEY === 'your-claude-api-key-here') {
    const fallback = fallbackNarrations[planetId] || `Explore the wonders of ${planetId}, a fascinating world in our solar system waiting to be discovered.`;
    if (onStream) {
      const words = fallback.split(' ');
      for (let i = 0; i < words.length; i++) {
        onStream(words[i] + ' ');
        await new Promise((r) => setTimeout(r, 40));
      }
    }
    setCachedNarration(planetId, fallback);
    return fallback;
  }

  const planet = planetMap.get(planetId);
  const planetName = planet?.name || planetId;
  const difficulty = experienceLevel === 'expert' ? 'with more technical astronomical terminology suitable for advanced learners' : 'in vivid, accessible language for beginners';

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 200,
        temperature: 0.7,
        system: 'You are a cinematic astronomer guide teaching students aged 10-18. Describe planets in vivid, exciting, scientifically accurate sentences. Be suspenseful and inspiring.',
        messages: [
          {
            role: 'user',
            content: `Describe ${planetName} in 3-4 vivid, exciting, scientifically accurate sentences ${difficulty}.`,
          },
        ],
        stream: !!onStream,
      }),
    });

    if (!response.ok) {
      throw new Error(`API error: ${response.status}`);
    }

    if (onStream && response.body) {
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let fullText = '';

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter((l) => l.startsWith('data: '));
        for (const line of lines) {
          try {
            const data = JSON.parse(line.slice(6));
            if (data.type === 'content_block_delta' && data.delta?.text) {
              fullText += data.delta.text;
              onStream(data.delta.text);
            }
          } catch {}
        }
      }

      setCachedNarration(planetId, fullText);
      return fullText;
    }

    const data = await response.json();
    const text = data.content?.[0]?.text || '';
    setCachedNarration(planetId, text);
    return text;
  } catch (error) {
    console.error('AI narration error:', error);
    const fallback = fallbackNarrations[planetId] || `${planetName} awaits your discovery! Each world in our solar system holds unique secrets and wonders.`;
    if (onStream) {
      const words = fallback.split(' ');
      for (let i = 0; i < words.length; i++) {
        onStream(words[i] + ' ');
        await new Promise((r) => setTimeout(r, 40));
      }
    }
    return fallback;
  }
}

export async function fetchQuiz(
  planetId: string,
  experienceLevel: string = 'beginner'
): Promise<QuizQuestion[]> {
  const planet = planetMap.get(planetId);
  const planetName = planet?.name || planetId;
  const difficulty = experienceLevel === 'expert' ? 'harder' : 'appropriate for middle school students';

  // Fallback quiz if no API
  if (!API_KEY || API_KEY === 'your-claude-api-key-here') {
    return getFallbackQuiz(planetId);
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 1000,
        temperature: 0.7,
        system: 'You are a science quiz generator for middle and high school students. Generate engaging multiple-choice questions. Return ONLY valid JSON array, no markdown formatting.',
        messages: [
          {
            role: 'user',
            content: `Generate 5 multiple-choice questions about ${planetName}. Difficulty: ${difficulty}. Return strict JSON array with objects containing: q (question string), options (array of 4 strings), answer (correct option string), fact (educational fact), difficulty ("easy"/"medium"/"hard").`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    const content = data.content?.[0]?.text || '';
    // Extract JSON from the response
    const jsonMatch = content.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      return JSON.parse(jsonMatch[0]);
    }
    return getFallbackQuiz(planetId);
  } catch (error) {
    console.error('AI quiz error:', error);
    return getFallbackQuiz(planetId);
  }
}

export async function fetchHint(
  question: string,
  wrongAnswer: string,
  correctAnswer: string
): Promise<string> {
  if (!API_KEY || API_KEY === 'your-claude-api-key-here') {
    return `Not quite! The correct answer is "${correctAnswer}". Think about why this makes sense—try to understand the concept rather than just memorizing the fact.`;
  }

  try {
    const response = await fetch(API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: MODEL,
        max_tokens: 150,
        temperature: 0.7,
        system: 'You are a helpful science tutor. Explain why an answer is wrong and guide the student to the correct answer.',
        messages: [
          {
            role: 'user',
            content: `Question: "${question}"\nStudent chose: "${wrongAnswer}"\nCorrect answer: "${correctAnswer}"\nExplain why the student's choice is wrong and give a clue to help them learn in 2 concise educational sentences.`,
          },
        ],
      }),
    });

    if (!response.ok) throw new Error(`API error: ${response.status}`);

    const data = await response.json();
    return data.content?.[0]?.text || 'Keep trying! Review the facts about this topic.';
  } catch {
    return `The correct answer is "${correctAnswer}". Take a moment to understand why this is right—every wrong answer is a step toward mastering the topic!`;
  }
}

function getFallbackQuiz(planetId: string): QuizQuestion[] {
  const quizzes: Record<string, QuizQuestion[]> = {
    mercury: [
      { q: 'How long is a year on Mercury?', options: ['88 Earth days', '225 Earth days', '365 Earth days', '687 Earth days'], answer: '88 Earth days', fact: 'Mercury has the shortest year of any planet due to its proximity to the Sun.', difficulty: 'easy' },
      { q: 'Why does Mercury have extreme temperature swings?', options: ['It has a thick atmosphere', 'It has almost no atmosphere', 'It is closest to the Sun', 'It rotates very fast'], answer: 'It has almost no atmosphere', fact: 'Without an atmosphere to retain heat, Mercury\'s surface temperature swings from -180°C to 430°C.', difficulty: 'medium' },
      { q: 'Which planet is hotter than Mercury despite being farther from the Sun?', options: ['Mars', 'Venus', 'Earth', 'Jupiter'], answer: 'Venus', fact: 'Venus has a runaway greenhouse effect making it hotter than Mercury.', difficulty: 'medium' },
      { q: 'What type of planet is Mercury?', options: ['Gas giant', 'Ice giant', 'Terrestrial planet', 'Dwarf planet'], answer: 'Terrestrial planet', fact: 'Mercury is a rocky terrestrial planet like Earth, Venus, and Mars.', difficulty: 'easy' },
      { q: 'What space missions have visited Mercury?', options: ['MESSENGER and BepiColombo', 'Voyager and Cassini', 'Curiosity and Perseverance', 'Galileo and Juno'], answer: 'MESSENGER and BepiColombo', fact: 'MESSENGER mapped Mercury\'s surface in detail, and BepiColombo is currently studying the planet.', difficulty: 'hard' },
    ],
    venus: [
      { q: 'What makes Venus the hottest planet in the solar system?', options: ['It is closest to the Sun', 'Runaway greenhouse effect', 'Volcanic activity', 'Thick oxygen atmosphere'], answer: 'Runaway greenhouse effect', fact: 'Venus\'s thick CO2 atmosphere traps heat, making it hotter than Mercury despite being farther from the Sun.', difficulty: 'medium' },
      { q: 'How does Venus rotate compared to most planets?', options: ['It doesn\'t rotate', 'It rotates backwards', 'It rotates twice as fast', 'It rotates sideways'], answer: 'It rotates backwards', fact: 'Venus has retrograde rotation, meaning the Sun rises in the west and sets in the east.', difficulty: 'medium' },
      { q: 'What are Venus\'s clouds made of?', options: ['Water vapor', 'Carbon dioxide', 'Sulfuric acid', 'Ammonia'], answer: 'Sulfuric acid', fact: 'Venus is shrouded in clouds of sulfuric acid that reflect sunlight, making it the brightest planet from Earth.', difficulty: 'hard' },
      { q: 'Why is Venus called Earth\'s "sister planet"?', options: ['Same color', 'Similar size and mass', 'Same atmosphere', 'Same temperature'], answer: 'Similar size and mass', fact: 'Venus is nearly the same size and mass as Earth, but its environment could not be more different.', difficulty: 'easy' },
      { q: 'Which country\'s Venera program successfully landed on Venus?', options: ['USA', 'Soviet Union', 'China', 'European Space Agency'], answer: 'Soviet Union', fact: 'The Soviet Venera program landed multiple probes on Venus, transmitting data from its hellish surface.', difficulty: 'hard' },
    ],
    earth: [
      { q: 'What percentage of Earth\'s surface is covered by water?', options: ['51%', '61%', '71%', '81%'], answer: '71%', fact: 'Earth is the only planet in our solar system with liquid water on its surface.', difficulty: 'easy' },
      { q: 'What protects Earth from harmful solar radiation?', options: ['Ozone layer', 'Magnetic field', 'Atmosphere', 'All of the above'], answer: 'All of the above', fact: 'Earth\'s magnetic field, atmosphere, and ozone layer work together to protect life from solar radiation.', difficulty: 'medium' },
      { q: 'How fast does Earth orbit the Sun?', options: ['67,000 km/h', '107,000 km/h', '150,000 km/h', '200,000 km/h'], answer: '107,000 km/h', fact: 'Earth zooms through space at about 107,000 km/h while spinning on its axis.', difficulty: 'hard' },
      { q: 'What is Earth\'s axial tilt?', options: ['12.44°', '23.44°', '33.44°', '43.44°'], answer: '23.44°', fact: 'Earth\'s 23.5-degree tilt causes our seasons as we orbit the Sun.', difficulty: 'medium' },
      { q: 'Which of these is NOT a layer of Earth\'s atmosphere?', options: ['Troposphere', 'Stratosphere', 'Lithosphere', 'Thermosphere'], answer: 'Lithosphere', fact: 'The lithosphere is Earth\'s solid outer layer, not part of the atmosphere.', difficulty: 'hard' },
    ],
    mars: [
      { q: 'What gives Mars its red color?', options: ['Iron oxide (rust)', 'Red sand', 'Volcanic rock', 'Carbon dioxide'], answer: 'Iron oxide (rust)', fact: 'Mars gets its famous red color from iron oxide, or rust, covering its surface.', difficulty: 'easy' },
      { q: 'How tall is Olympus Mons, the largest volcano in the solar system?', options: ['12 km', '21.9 km', '30 km', '50 km'], answer: '21.9 km', fact: 'Olympus Mons is nearly 3 times the height of Mount Everest.', difficulty: 'medium' },
      { q: 'What is a "sol" on Mars?', options: ['A Martian year', 'A Martian day', 'A Martian month', 'A Martian season'], answer: 'A Martian day', fact: 'A sol is a Martian day, lasting 24 hours and 40 minutes—just slightly longer than an Earth day.', difficulty: 'medium' },
      { q: 'Which NASA rover is currently exploring Mars?', options: ['Curiosity', 'Perseverance', 'Opportunity', 'Spirit'], answer: 'Perseverance', fact: 'Perseverance landed on Mars in 2021, collecting samples for eventual return to Earth.', difficulty: 'easy' },
      { q: 'How many moons does Mars have?', options: ['0', '1', '2', '3'], answer: '2', fact: 'Mars has two small moons: Phobos and Deimos, which are likely captured asteroids.', difficulty: 'easy' },
    ],
    jupiter: [
      { q: 'What is the Great Red Spot on Jupiter?', options: ['A volcano', 'A storm', 'A crater', 'A mountain'], answer: 'A storm', fact: 'The Great Red Spot is a storm larger than Earth that has been raging for at least 400 years.', difficulty: 'easy' },
      { q: 'How many Earths could fit inside Jupiter?', options: ['130', '1,300', '13,000', '130,000'], answer: '1,300', fact: 'Jupiter is the largest planet in our solar system, with a mass more than double all other planets combined.', difficulty: 'medium' },
      { q: 'What is Jupiter mostly made of?', options: ['Rock and iron', 'Water and ammonia', 'Hydrogen and helium', 'Carbon dioxide'], answer: 'Hydrogen and helium', fact: 'Jupiter\'s composition is similar to the Sun—mostly hydrogen and helium.', difficulty: 'medium' },
      { q: 'Which of Jupiter\'s moons is known for having volcanoes?', options: ['Europa', 'Ganymede', 'Callisto', 'Io'], answer: 'Io', fact: 'Io is the most volcanically active body in the solar system, with hundreds of volcanoes.', difficulty: 'hard' },
      { q: 'Jupiter has a faint ring system. What are the rings made of?', options: ['Ice', 'Dust', 'Rock', 'Metal'], answer: 'Dust', fact: 'Jupiter\'s faint rings are made of dust particles kicked up by meteor impacts on its small inner moons.', difficulty: 'hard' },
    ],
    saturn: [
      { q: 'What are Saturn\'s rings mostly made of?', options: ['Rock', 'Ice and rock', 'Metal', 'Gas'], answer: 'Ice and rock', fact: 'Saturn\'s rings are made of billions of ice and rock particles, from tiny grains to house-sized chunks.', difficulty: 'easy' },
      { q: 'How thick are Saturn\'s rings compared to their width?', options: ['100 meters thick', '10 meters thick', '1 km thick', '100 km thick'], answer: '10 meters thick', fact: 'Saturn\'s rings span 282,000 km but are only about 10 meters thick—thinner than a sheet of paper proportionally.', difficulty: 'hard' },
      { q: 'Would Saturn float in water?', options: ['Yes', 'No', 'Only in salt water', 'It would partially sink'], answer: 'Yes', fact: 'Saturn is the least dense planet—it would float in water if you could find a pool big enough!', difficulty: 'medium' },
      { q: 'How many known moons does Saturn have?', options: ['62', '95', '146', '27'], answer: '146', fact: 'Saturn has at least 146 known moons, more than any other planet in the solar system.', difficulty: 'hard' },
      { q: 'Which Saturn moon has liquid methane lakes?', options: ['Enceladus', 'Titan', 'Mimas', 'Rhea'], answer: 'Titan', fact: 'Titan, Saturn\'s largest moon, has a thick atmosphere and lakes of liquid methane and ethane.', difficulty: 'medium' },
    ],
    uranus: [
      { q: 'What makes Uranus unique among the planets?', options: ['It rotates backwards', 'It rotates on its side', 'It has no atmosphere', 'It has no moons'], answer: 'It rotates on its side', fact: 'Uranus has an extreme 98-degree axial tilt, essentially rolling through space on its side.', difficulty: 'medium' },
      { q: 'What gives Uranus its blue-green color?', options: ['Water', 'Methane', 'Oxygen', 'Nitrogen'], answer: 'Methane', fact: 'Methane in Uranus\'s atmosphere absorbs red light, giving the planet its distinctive blue-green appearance.', difficulty: 'medium' },
      { q: 'When was Uranus discovered?', options: ['1610', '1781', '1846', '1900'], answer: '1781', fact: 'William Herschel discovered Uranus in 1781, the first planet found using a telescope.', difficulty: 'hard' },
      { q: 'Which spacecraft has visited Uranus?', options: ['Voyager 1', 'Voyager 2', 'Cassini', 'New Horizons'], answer: 'Voyager 2', fact: 'Voyager 2 is the only spacecraft to have flown past Uranus, in 1986.', difficulty: 'hard' },
      { q: 'What type of planet is Uranus?', options: ['Gas giant', 'Terrestrial planet', 'Ice giant', 'Dwarf planet'], answer: 'Ice giant', fact: 'Uranus and Neptune are classified as ice giants, distinct from the gas giants Jupiter and Saturn.', difficulty: 'easy' },
    ],
    neptune: [
      { q: 'How fast are Neptune\'s winds?', options: ['1,000 km/h', '1,500 km/h', '2,100 km/h', '3,000 km/h'], answer: '2,100 km/h', fact: 'Neptune has the fastest winds in the solar system, reaching an incredible 2,100 km/h.', difficulty: 'medium' },
      { q: 'How was Neptune discovered?', options: ['By telescope', 'By mathematical prediction', 'By accident', 'By spacecraft'], answer: 'By mathematical prediction', fact: 'Neptune was the first planet discovered through mathematical prediction before visual observation.', difficulty: 'medium' },
      { q: 'How long does it take Neptune to orbit the Sun?', options: ['84 years', '165 years', '250 years', '84 years'], answer: '165 years', fact: 'Neptune takes 165 Earth years to complete one orbit—it hasn\'t made a full orbit since its discovery in 1846!', difficulty: 'hard' },
      { q: 'What color is Neptune?', options: ['Red', 'Green', 'Vivid blue', 'Yellow'], answer: 'Vivid blue', fact: 'Neptune\'s vivid blue color is due to methane absorbing red light and the scattering of blue light in its atmosphere.', difficulty: 'easy' },
      { q: 'Which spacecraft has visited Neptune?', options: ['Voyager 1', 'Voyager 2', 'Cassini', 'New Horizons'], answer: 'Voyager 2', fact: 'Voyager 2 flew past Neptune in 1989, giving us our first close-up views of this distant world.', difficulty: 'hard' },
    ],
    sun: [
      { q: 'What percentage of the solar system\'s mass is in the Sun?', options: ['86%', '95%', '99.86%', '100%'], answer: '99.86%', fact: 'The Sun contains 99.86% of all mass in the solar system.', difficulty: 'easy' },
      { q: 'What process powers the Sun?', options: ['Burning gas', 'Nuclear fusion', 'Nuclear fission', 'Chemical reactions'], answer: 'Nuclear fusion', fact: 'The Sun converts hydrogen into helium through nuclear fusion at 15 million degrees Celsius in its core.', difficulty: 'medium' },
      { q: 'How long does it take sunlight to reach Earth?', options: ['8 seconds', '8 minutes', '8 hours', '8 days'], answer: '8 minutes', fact: 'Light from the Sun takes about 8 minutes and 20 seconds to travel the 149.6 million km to Earth.', difficulty: 'easy' },
      { q: 'What is the surface temperature of the Sun?', options: ['3,000°C', '5,500°C', '15,000,000°C', '10,000°C'], answer: '5,500°C', fact: 'The Sun\'s surface is about 5,500°C, while its core reaches a staggering 15 million degrees.', difficulty: 'medium' },
      { q: 'What type of star is the Sun?', options: ['Red giant', 'White dwarf', 'Yellow dwarf', 'Blue giant'], answer: 'Yellow dwarf', fact: 'The Sun is classified as a G-type main-sequence star, commonly called a yellow dwarf.', difficulty: 'hard' },
    ],
  };

  return quizzes[planetId] || quizzes.earth;
}