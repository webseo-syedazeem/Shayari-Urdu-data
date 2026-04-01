import { supabase } from '../config/database';

const poets = [
  {
    name: 'Mirza Ghalib',
    slug: 'mirza-ghalib',
    short_bio: 'Romantic & philosophical Urdu poet',
    long_bio: 'One of the most influential Urdu poets of all time, known for his philosophical and romantic ghazals.',
    primary_language: 'urdu' as const,
    avatar_url: 'https://images.pexels.com/photos/1222271/pexels-photo-1222271.jpeg?auto=compress&cs=tinysrgb&w=200',
    country: 'India',
    birth_year: 1797,
    death_year: 1869
  },
  {
    name: 'Allama Iqbal',
    slug: 'allama-iqbal',
    short_bio: 'Spiritual & motivational poet',
    long_bio: 'Poet-philosopher who inspired the Pakistan movement with his powerful verse about self-realization and spiritual awakening.',
    primary_language: 'urdu' as const,
    avatar_url: 'https://images.pexels.com/photos/614810/pexels-photo-614810.jpeg?auto=compress&cs=tinysrgb&w=200',
    country: 'Pakistan',
    birth_year: 1877,
    death_year: 1938
  },
  {
    name: 'Faiz Ahmad Faiz',
    slug: 'faiz-ahmad-faiz',
    short_bio: 'Revolutionary & romantic poet',
    long_bio: 'Revolutionary poet who blended romance with social and political themes, one of the most celebrated poets of the modern era.',
    primary_language: 'urdu' as const,
    avatar_url: 'https://images.pexels.com/photos/1681010/pexels-photo-1681010.jpeg?auto=compress&cs=tinysrgb&w=200',
    country: 'Pakistan',
    birth_year: 1911,
    death_year: 1984
  },
  {
    name: 'Mir Taqi Mir',
    slug: 'mir-taqi-mir',
    short_bio: 'Master of melancholic verse',
    long_bio: 'Master of the ghazal form, known for his melancholic and deeply emotional poetry about love and loss.',
    primary_language: 'urdu' as const,
    avatar_url: 'https://images.pexels.com/photos/1516680/pexels-photo-1516680.jpeg?auto=compress&cs=tinysrgb&w=200',
    country: 'India',
    birth_year: 1723,
    death_year: 1810
  },
  {
    name: 'Ahmad Faraz',
    slug: 'ahmad-faraz',
    short_bio: 'Modern romantic poet',
    long_bio: 'Contemporary poet celebrated for his romantic ghazals and accessible style that resonated with masses.',
    primary_language: 'urdu' as const,
    avatar_url: 'https://images.pexels.com/photos/1212984/pexels-photo-1212984.jpeg?auto=compress&cs=tinysrgb&w=200',
    country: 'Pakistan',
    birth_year: 1931,
    death_year: 2008
  },
  {
    name: 'Gulzar',
    slug: 'gulzar',
    short_bio: 'Contemporary lyricist & poet',
    long_bio: 'Renowned lyricist and poet known for simple yet profound expressions of human emotions and relationships.',
    primary_language: 'urdu' as const,
    avatar_url: 'https://images.pexels.com/photos/1310522/pexels-photo-1310522.jpeg?auto=compress&cs=tinysrgb&w=200',
    country: 'India',
    birth_year: 1934,
    death_year: null
  }
];

const topics = [
  { name: 'Love', slug: 'love', description: 'Poetry about love and romance', icon: '❤️' },
  { name: 'Life', slug: 'life', description: 'Reflections on life and existence', icon: '🌟' },
  { name: 'Pain', slug: 'pain', description: 'Poetry about heartbreak and sorrow', icon: '💔' },
  { name: 'Hope', slug: 'hope', description: 'Verses of optimism and hope', icon: '🌈' },
  { name: 'Philosophy', slug: 'philosophy', description: 'Deep philosophical thoughts', icon: '🤔' }
];

async function seed() {
  console.log('Starting database seed...');

  try {
    const { data: existingPoets } = await supabase
      .from('poets')
      .select('id');

    let insertedPoets;
    if (!existingPoets || existingPoets.length === 0) {
      console.log('Inserting poets...');
      const { data, error: poetsError } = await supabase
        .from('poets')
        .insert(poets)
        .select();

      if (poetsError) throw poetsError;
      insertedPoets = data;
      console.log(`Inserted ${insertedPoets?.length} poets`);
    } else {
      console.log('Poets already exist, fetching...');
      const { data } = await supabase
        .from('poets')
        .select('*');
      insertedPoets = data;
      console.log(`Found ${insertedPoets?.length} existing poets`);
    }

    const { data: existingTopics } = await supabase
      .from('topics')
      .select('id');

    let insertedTopics;
    if (!existingTopics || existingTopics.length === 0) {
      console.log('Inserting topics...');
      const { data, error: topicsError } = await supabase
        .from('topics')
        .insert(topics)
        .select();

      if (topicsError) throw topicsError;
      insertedTopics = data;
      console.log(`Inserted ${insertedTopics?.length} topics`);
    } else {
      console.log('Topics already exist, fetching...');
      const { data } = await supabase
        .from('topics')
        .select('*');
      insertedTopics = data;
      console.log(`Found ${insertedTopics?.length} existing topics`);
    }

    const ghalib = insertedPoets?.find(p => p.slug === 'mirza-ghalib');
    const iqbal = insertedPoets?.find(p => p.slug === 'allama-iqbal');
    const faiz = insertedPoets?.find(p => p.slug === 'faiz-ahmad-faiz');

    const loveTopic = insertedTopics?.find(t => t.slug === 'love');
    const lifeTopic = insertedTopics?.find(t => t.slug === 'life');
    const painTopic = insertedTopics?.find(t => t.slug === 'pain');

    const shayariData = [
      {
        poet_id: ghalib?.id,
        form: 'sher' as const,
        is_trending: true,
        popularity_score: 2847,
        featured_image_url: 'https://images.pexels.com/photos/733857/pexels-photo-733857.jpeg?auto=compress&cs=tinysrgb&w=800',
        featured_image_alt: 'Poetry book with tea'
      },
      {
        poet_id: ghalib?.id,
        form: 'sher' as const,
        popularity_score: 3156,
        featured_image_url: 'https://images.pexels.com/photos/1370295/pexels-photo-1370295.jpeg?auto=compress&cs=tinysrgb&w=800',
        featured_image_alt: 'Vintage writing desk'
      },
      {
        poet_id: iqbal?.id,
        form: 'sher' as const,
        is_featured: true,
        popularity_score: 4521,
        featured_image_url: 'https://images.pexels.com/photos/235985/pexels-photo-235985.jpeg?auto=compress&cs=tinysrgb&w=800',
        featured_image_alt: 'Open book with glasses'
      },
      {
        poet_id: faiz?.id,
        form: 'sher' as const,
        popularity_score: 2934,
        featured_image_url: 'https://images.pexels.com/photos/1906437/pexels-photo-1906437.jpeg?auto=compress&cs=tinysrgb&w=800',
        featured_image_alt: 'Rose on poetry page'
      }
    ];

    console.log('Inserting shayari...');
    const { data: insertedShayari, error: shayariError } = await supabase
      .from('shayari')
      .insert(shayariData)
      .select();

    if (shayariError) throw shayariError;
    console.log(`Inserted ${insertedShayari?.length} shayari`);

    const languageVersions = [
      {
        shayari_id: insertedShayari?.[0]?.id,
        language: 'roman_urdu' as const,
        text: 'Hazaaron khwahishen aisi ke har khwahish pe dam nikle\nBohat nikle mere armaan lekin phir bhi kam nikle'
      },
      {
        shayari_id: insertedShayari?.[0]?.id,
        language: 'urdu' as const,
        text: 'ہزاروں خواہشیں ایسی کہ ہر خواہش پہ دم نکلے\nبہت نکلے مرے ارماں لیکن پھر بھی کم نکلے'
      },
      {
        shayari_id: insertedShayari?.[0]?.id,
        language: 'english' as const,
        text: 'Thousands of desires, each one requiring a lifetime to fulfill\nMany of my wishes came true, yet they still seem too few'
      },
      {
        shayari_id: insertedShayari?.[1]?.id,
        language: 'roman_urdu' as const,
        text: 'Dil hi to hai na sang-o-khisht dard se bhar na aaye kyun\nRoyenge hum hazaar baar koi hamein sataye kyun'
      },
      {
        shayari_id: insertedShayari?.[2]?.id,
        language: 'roman_urdu' as const,
        text: 'Khudi ko kar buland itna ke har taqder se pehle\nKhuda bande se khud pooche bata teri raza kya hai'
      },
      {
        shayari_id: insertedShayari?.[3]?.id,
        language: 'roman_urdu' as const,
        text: 'Gulon mein rang bhare baad-e-naubahaar chale\nChale bhi aao ke gulshan ka karobaar chale'
      }
    ];

    console.log('Inserting language versions...');
    const { error: versionsError } = await supabase
      .from('shayari_language_versions')
      .insert(languageVersions);

    if (versionsError) throw versionsError;
    console.log(`Inserted ${languageVersions.length} language versions`);

    if (insertedShayari && loveTopic && lifeTopic && painTopic) {
      const shayariTopics = [
        { shayari_id: insertedShayari[0]?.id, topic_id: loveTopic.id },
        { shayari_id: insertedShayari[0]?.id, topic_id: lifeTopic.id },
        { shayari_id: insertedShayari[1]?.id, topic_id: painTopic.id },
        { shayari_id: insertedShayari[2]?.id, topic_id: lifeTopic.id }
      ];

      console.log('Linking shayari to topics...');
      const { error: topicsLinkError } = await supabase
        .from('shayari_topics')
        .insert(shayariTopics);

      if (topicsLinkError) throw topicsLinkError;
      console.log(`Linked ${shayariTopics.length} shayari-topic relationships`);
    }

    const collections = [
      {
        title: 'Best of Ghalib',
        slug: 'best-of-ghalib',
        description: 'Timeless verses from Mirza Ghalib',
        cover_image: 'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg?auto=compress&cs=tinysrgb&w=400',
        is_featured: true
      }
    ];

    console.log('Inserting collections...');
    const { data: insertedCollections, error: collectionsError } = await supabase
      .from('collections')
      .insert(collections)
      .select();

    if (collectionsError) throw collectionsError;
    console.log(`Inserted ${insertedCollections?.length} collections`);

    const ebooksData = [
      {
        slug: 'divan-e-ghalib',
        poet_id: ghalib?.id,
        poet_name: 'Mirza Ghalib',
        titles: {
          romanUrdu: 'Divan-e-Ghalib',
          urdu: 'دیوان غالب',
          english: 'Diwan of Ghalib'
        },
        descriptions: {
          romanUrdu: 'Ghalib ki ghazalon aur shayari ka mukammal majmua',
          urdu: 'غالب کی غزلوں اور شاعری کا مکمل مجموعہ',
          english: 'Complete collection of Ghalib\'s ghazals and poetry'
        },
        cover_image: 'https://images.pexels.com/photos/1907785/pexels-photo-1907785.jpeg?auto=compress&cs=tinysrgb&w=400',
        pages: 456,
        file_url_pdf: '/ebooks/divan-e-ghalib.pdf'
      }
    ];

    console.log('Inserting ebooks...');
    const { error: ebooksError } = await supabase
      .from('ebooks')
      .insert(ebooksData);

    if (ebooksError) throw ebooksError;
    console.log(`Inserted ${ebooksData.length} ebooks`);

    const dictionaryData = [
      {
        word_key: 'khwahish',
        word_urdu: 'خواہش',
        word_roman: 'khwahish',
        word_english: 'desire',
        part_of_speech: 'noun',
        meanings_english: ['desire', 'wish', 'longing', 'aspiration'],
        meanings_urdu: ['خواہش', 'آرزو', 'تمنا'],
        synonyms: ['armaan', 'tamanna', 'arzoo']
      },
      {
        word_key: 'armaan',
        word_urdu: 'ارمان',
        word_roman: 'armaan',
        word_english: 'aspiration',
        part_of_speech: 'noun',
        meanings_english: ['aspiration', 'cherished desire', 'hope'],
        meanings_urdu: ['ارمان', 'تمنا', 'آرزو'],
        synonyms: ['khwahish', 'tamanna']
      },
      {
        word_key: 'dil',
        word_urdu: 'دل',
        word_roman: 'dil',
        word_english: 'heart',
        part_of_speech: 'noun',
        meanings_english: ['heart', 'soul', 'emotions'],
        meanings_urdu: ['دل', 'قلب'],
        synonyms: ['qalb', 'jigar']
      }
    ];

    console.log('Inserting dictionary entries...');
    const { error: dictError } = await supabase
      .from('dictionary_entries')
      .insert(dictionaryData);

    if (dictError) throw dictError;
    console.log(`Inserted ${dictionaryData.length} dictionary entries`);

    const adSlots = [
      {
        key: 'home_hero_top',
        title: 'Home Hero Top Banner',
        description: 'Large banner ad at the top of home page',
        is_active: true,
        html_snippet: '<!-- Google Ad placeholder -->'
      }
    ];

    console.log('Inserting ad slots...');
    const { error: adsError } = await supabase
      .from('ad_slots')
      .insert(adSlots);

    if (adsError) throw adsError;
    console.log(`Inserted ${adSlots.length} ad slots`);

    console.log('✅ Database seeding completed successfully!');
  } catch (error) {
    console.error('❌ Error seeding database:', error);
    throw error;
  }
}

seed()
  .then(() => process.exit(0))
  .catch(() => process.exit(1));
