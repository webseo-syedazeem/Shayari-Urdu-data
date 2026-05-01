import { Router } from 'express';
import { supabase } from '../config/database';

const router = Router();

router.get('/', async (req, res) => {
  try {
    const { query = '', page = '1', pageSize = '50' } = req.query;
    const offset = (Number(page) - 1) * Number(pageSize);

    let dbQuery = supabase.from('dictionary_entries').select('*', { count: 'exact' });
    if (query) {
      dbQuery = dbQuery.or(`word_key.ilike.%${query}%,word_roman.ilike.%${query}%,word_english.ilike.%${query}%,word_urdu.ilike.%${query}%`);
    }
    dbQuery = dbQuery.order('word_key').range(offset, offset + Number(pageSize) - 1);

    const { data, error, count } = await dbQuery;
    if (error) throw error;
    res.json({ data, pagination: { page: Number(page), pageSize: Number(pageSize), total: count || 0, totalPages: Math.ceil((count || 0) / Number(pageSize)) } });
  } catch (error) {
    console.error('Error fetching dictionary entries:', error);
    res.status(500).json({ error: 'Failed to fetch dictionary entries' });
  }
});

router.get('/by-id/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('dictionary_entries').select('*').eq('id', id).maybeSingle();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Dictionary entry not found' });
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch dictionary entry' });
  }
});

router.get('/:wordKey', async (req, res) => {
  try {
    const { wordKey } = req.params;
    const { data, error } = await supabase.from('dictionary_entries').select('*').eq('word_key', wordKey).single();
    if (error) throw error;
    if (!data) return res.status(404).json({ error: 'Dictionary entry not found' });
    res.json(data);
  } catch (error) {
    console.error('Error fetching dictionary entry:', error);
    res.status(500).json({ error: 'Failed to fetch dictionary entry' });
  }
});

router.post('/', async (req, res) => {
  try {
    const { word_key, word_urdu, word_roman, word_hindi, word_english, meanings_english, meanings_urdu, part_of_speech, pronunciation, notes, synonyms, seo_title, seo_description, seo_keywords } = req.body;
    if (!word_key) return res.status(400).json({ error: 'word_key is required' });

    const { data, error } = await supabase.from('dictionary_entries').insert({
      word_key, word_urdu: word_urdu || null, word_roman: word_roman || null,
      word_hindi: word_hindi || null, word_english: word_english || null,
      meanings_english: meanings_english || [], meanings_urdu: meanings_urdu || [],
      part_of_speech: part_of_speech || null, pronunciation: pronunciation || null,
      notes: notes || null, synonyms: synonyms || [],
      seo_title: seo_title?.trim() || null, seo_description: seo_description?.trim() || null, seo_keywords: seo_keywords?.trim() || null
    }).select().single();

    if (error) throw error;
    res.status(201).json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to create dictionary entry' });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { word_key, word_urdu, word_roman, word_hindi, word_english, meanings_english, meanings_urdu, part_of_speech, pronunciation, notes, synonyms, seo_title, seo_description, seo_keywords } = req.body;

    const updateData: any = {};
    if (word_key !== undefined) updateData.word_key = word_key;
    if (word_urdu !== undefined) updateData.word_urdu = word_urdu;
    if (word_roman !== undefined) updateData.word_roman = word_roman;
    if (word_hindi !== undefined) updateData.word_hindi = word_hindi;
    if (word_english !== undefined) updateData.word_english = word_english;
    if (meanings_english !== undefined) updateData.meanings_english = meanings_english;
    if (meanings_urdu !== undefined) updateData.meanings_urdu = meanings_urdu;
    if (part_of_speech !== undefined) updateData.part_of_speech = part_of_speech;
    if (pronunciation !== undefined) updateData.pronunciation = pronunciation;
    if (notes !== undefined) updateData.notes = notes;
    if (synonyms !== undefined) updateData.synonyms = synonyms;
    if (seo_title !== undefined) updateData.seo_title = seo_title?.trim() || null;
    if (seo_description !== undefined) updateData.seo_description = seo_description?.trim() || null;
    if (seo_keywords !== undefined) updateData.seo_keywords = seo_keywords?.trim() || null;

    const { data, error } = await supabase.from('dictionary_entries').update(updateData).eq('id', id).select().single();
    if (error) throw error;
    res.json(data);
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to update dictionary entry' });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { error } = await supabase.from('dictionary_entries').delete().eq('id', id);
    if (error) throw error;
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message || 'Failed to delete dictionary entry' });
  }
});

export default router;
