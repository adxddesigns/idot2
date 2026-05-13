// insult.js — AI-powered profile-based roast generator for Idot 2
// Uses the Anthropic API to roast someone based on their actual Discord profile data.
// Hard rules: NO roasting of sexuality, orientation, sexual preferences, religion, or protected identity.

const Anthropic = require('@anthropic-ai/sdk');

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
});

/**
 * Builds a plain-text profile summary from Discord user/member objects
 * to feed into the AI roast prompt.
 */
function buildProfileSummary(user, member) {
  const lines = [];

  lines.push(`Username: ${user.username}`);

  if (user.globalName && user.globalName !== user.username) {
    lines.push(`Display name: ${user.globalName}`);
  }

  if (member?.nickname) {
    lines.push(`Server nickname: ${member.nickname}`);
  }

  // Account age
  const created = user.createdAt;
  const ageMs = Date.now() - created.getTime();
  const ageDays = Math.floor(ageMs / (1000 * 60 * 60 * 24));
  const ageYears = (ageDays / 365).toFixed(1);
  lines.push(`Account age: ${ageYears} years (${ageDays} days old)`);

  // Bot flag
  if (user.bot) lines.push('Account type: BOT');

  // Roles (top 5, skip @everyone)
  if (member?.roles?.cache?.size > 1) {
    const roles = member.roles.cache
      .filter(r => r.name !== '@everyone')
      .sort((a, b) => b.position - a.position)
      .first(5)
      .map(r => r.name);
    if (roles.length) lines.push(`Roles: ${roles.join(', ')}`);
  }

  // Join date
  if (member?.joinedAt) {
    const joinedDays = Math.floor((Date.now() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24));
    lines.push(`Server join date: ${joinedDays} days ago`);
  }

  // Avatar check
  const hasCustomAvatar = !!user.avatar;
  lines.push(`Custom avatar: ${hasCustomAvatar ? 'Yes' : 'No (using default)'}`);

  // Banner check
  const hasCustomBanner = !!user.banner;
  lines.push(`Profile banner: ${hasCustomBanner ? 'Yes' : 'No'}`);

  return lines.join('\n');
}

/**
 * Calls the Anthropic API to generate a short, sharp, personalized roast.
 */
async function generateInsult(user, member) {
  const profileSummary = buildProfileSummary(user, member);

  const systemPrompt = `You are Idot 2, a savage but witty Discord roast bot beloved by thousands. 
Your job is to roast Discord users based ONLY on publicly visible profile data given to you.

STRICT RULES — never break these:
- Do NOT mention, imply, or joke about: sexuality, sexual orientation, sexual preferences, gender identity, religion, ethnicity, race, disability, or any protected characteristic.
- Do NOT make up information not in the profile. Only roast what's actually there.
- Keep the roast to 2-4 sentences maximum. Short, punchy, devastating.
- Write in a Gen Z internet tone — dry, sharp, a little unhinged, but always clever.
- Do NOT use slurs, hate speech, or anything genuinely harmful.
- Focus on roastable facts: username choices, account age, lack of avatar, role names, nickname, how long they've been in a server, etc.
- End with one short killer punchline.
- Do not introduce yourself or explain yourself. Just deliver the roast.`;

  const userPrompt = `Roast this Discord user based on their profile info:

${profileSummary}

Write a 2-4 sentence roast. Make it personal to the profile. Be funny and brutal.`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 300,
    system: systemPrompt,
    messages: [
      { role: 'user', content: userPrompt }
    ],
  });

  const text = response.content
    .filter(block => block.type === 'text')
    .map(block => block.text)
    .join('\n')
    .trim();

  return text || "I tried to roast them and even the AI gave up. That's somehow worse.";
}

module.exports = { generateInsult };
