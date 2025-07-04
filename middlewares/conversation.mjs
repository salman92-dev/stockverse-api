import express from 'express';
import pool from '../Db/db.mjs';

// Route to create a new conversation
async function add_conversation(req, res){
  const { userid } = req.body;

  try {
    const selectChatId = await pool.query(
      'SELECT * FROM CONVERSATION WHERE userid = $1 ORDER BY created_at DESC LIMIT 1',
      [userid]
    );
    if(selectChatId.rows.length > 0 && selectChatId.rows[0].title === null){
      return res.status(207).json({
        message : 'old chat_id returned',
        chat_id:selectChatId.rows[0].chat_id
      })
    }
    const result = await pool.query(
      'INSERT INTO conversation (userid) VALUES ($1) RETURNING *',
      [userid]
    );
    res.status(207).json({message: 'chat id created successfully', chat_id:result.rows[0].chat_id});
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Error creating conversation' });
  }
};

export default add_conversation;
