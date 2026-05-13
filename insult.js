// insult.js — Profile-based insult generator for Idot 2
// No API key required. Uses real Discord profile data with template-based roasts.
// Hard rules: NO roasting of sexuality, orientation, religion, race, or any protected characteristic.

function getRandom(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function buildProfileData(user, member) {
  const ageDays = Math.floor((Date.now() - user.createdAt.getTime()) / (1000 * 60 * 60 * 24));
  const ageYears = (ageDays / 365).toFixed(1);
  const hasAvatar = !!user.avatar;
  const hasBanner = !!user.banner;
  const isBot = user.bot;

  const roles = member?.roles?.cache
    ? member.roles.cache
        .filter(r => r.name !== '@everyone')
        .sort((a, b) => b.position - a.position)
        .map(r => r.name)
        .slice(0, 3)
    : [];

  const joinedDays = member?.joinedAt
    ? Math.floor((Date.now() - member.joinedAt.getTime()) / (1000 * 60 * 60 * 24))
    : null;

  const nickname = member?.nickname || null;
  const username = user.username;
  const displayName = user.globalName || username;

  return { username, displayName, ageDays, ageYears, hasAvatar, hasBanner, isBot, roles, joinedDays, nickname };
}

function generateInsult(user, member) {
  const p = buildProfileData(user, member);
  const pool = [];

  // ── Username roasts ────────────────────────────────────────────────────────
  pool.push(`**${p.username}** chose that username themselves. Voluntarily. With no one forcing them. Let that sink in.`);
  pool.push(`The name **${p.username}** really said "this is my brand" and kept it moving. Respect for the delusion.`);
  pool.push(`**${p.username}** is a username that raises questions nobody wants the answers to.`);
  pool.push(`Imagine introducing yourself in real life as **${p.username}**. Actually don't, it's too sad.`);
  pool.push(`**${p.username}** typed that username out, looked at it, and thought "yes, this represents me." Chilling.`);

  // ── No avatar roasts ───────────────────────────────────────────────────────
  if (!p.hasAvatar) {
    pool.push(`**${p.username}** is out here in ${new Date().getFullYear()} with a default avatar. The default. The one Discord picks when you give up before you even start.`);
    pool.push(`No profile picture. **${p.username}** said "you don't get to know what I look like AND I won't even give you a cartoon." Unmatched energy.`);
    pool.push(`**${p.username}** has a default avatar, which tells me everything I need to know about their commitment to anything.`);
    pool.push(`The default avatar is doing a lot of heavy lifting for **${p.username}**. It's carrying the whole personality.`);
  }

  // ── Has avatar roasts ──────────────────────────────────────────────────────
  if (p.hasAvatar && !p.hasBanner) {
    pool.push(`**${p.username}** got a profile picture but couldn't be bothered with a banner. Half the effort, half the person.`);
    pool.push(`Got an avatar, no banner. **${p.username}** started customizing their profile and just... stopped. Relatable honestly.`);
  }

  // ── Account age roasts ─────────────────────────────────────────────────────
  if (p.ageDays < 30) {
    pool.push(`**${p.username}**'s account is ${p.ageDays} days old. Brand new to Discord and already using this bot. The villain arc started early.`);
    pool.push(`${p.ageDays} days on Discord and **${p.username}** is already here. No grace period, straight to the chaos.`);
  } else if (p.ageDays < 365) {
    pool.push(`**${p.username}** has been on Discord for ${p.ageDays} days and this is how they're spending it. The journey from new user to this is genuinely impressive.`);
  } else if (p.ageYears >= 5) {
    pool.push(`**${p.username}** has been on Discord for ${p.ageYears} years. ${p.ageYears} years of this. Think about that.`);
    pool.push(`${p.ageYears} years on Discord, **${p.username}**. At some point this stops being a hobby and starts being a lifestyle choice that deserves a conversation.`);
  } else {
    pool.push(`**${p.username}** has a ${p.ageYears} year old account, which means they've had plenty of time to get better at this. They didn't.`);
  }

  // ── Nickname roasts ────────────────────────────────────────────────────────
  if (p.nickname) {
    pool.push(`**${p.username}** goes by "${p.nickname}" here. They gave themselves a nickname. In a server. Like a main character. They are not the main character.`);
    pool.push(`Username: **${p.username}**. Nickname: "${p.nickname}". Two names, zero hits.`);
    pool.push(`"${p.nickname}" is the nickname **${p.username}** wanted people to call them. I'll let you decide what that says about them.`);
  }

  // ── Display name different from username ───────────────────────────────────
  if (p.displayName !== p.username) {
    pool.push(`Goes by **${p.displayName}** but the username is **${p.username}**. Pick a personality and stay there.`);
  }

  // ── Role roasts ────────────────────────────────────────────────────────────
  if (p.roles.length === 0) {
    pool.push(`**${p.username}** has zero roles in this server. A ghost. A phantom. Completely uncategorizable. The server doesn't even know what to do with them.`);
    pool.push(`No roles at all. **${p.username}** is just floating in this server with no purpose or identity. Honestly iconic in a tragic way.`);
  } else if (p.roles.length === 1) {
    pool.push(`One role. **${p.username}** has exactly one role — "${p.roles[0]}". They're hanging on by a thread and that thread is "${p.roles[0]}".`);
  } else {
    pool.push(`**${p.username}** has roles like "${p.roles[0]}" which raises more questions than it answers.`);
    pool.push(`"${p.roles.join('", "')}" — the roles of **${p.username}**. A journey. Not a good one, but a journey.`);
  }

  // ── Server join date roasts ────────────────────────────────────────────────
  if (p.joinedDays !== null) {
    if (p.joinedDays < 1) {
      pool.push(`**${p.username}** joined this server today and immediately used this command. No warmup. No introduction. Straight to it. Unwell behavior.`);
    } else if (p.joinedDays < 7) {
      pool.push(`**${p.username}** joined ${p.joinedDays} days ago. ${p.joinedDays} days and this is already how they're spending their time here. The server deserved better.`);
    } else if (p.joinedDays > 365) {
      const joinYears = (p.joinedDays / 365).toFixed(1);
      pool.push(`**${p.username}** has been in this server for ${joinYears} years and THIS is the energy they bring. ${joinYears} years of this.`);
    } else {
      pool.push(`${p.joinedDays} days in this server, **${p.username}**. ${p.joinedDays} days and still doing this. Growth is not happening.`);
    }
  }

  // ── Bot roast (rare case) ──────────────────────────────────────────────────
  if (p.isBot) {
    pool.push(`**${p.username}** is a bot getting roasted by another bot. We have achieved something historic today.`);
  }

  // ── Generic bangers (always in pool) ──────────────────────────────────────
  pool.push(`**${p.username}** is the type of person who reads the Terms of Service and still makes bad decisions.`);
  pool.push(`Everything about **${p.username}**'s profile screams "I make it everyone else's problem." Respect the consistency.`);
  pool.push(`**${p.username}** said "let me get roasted" and honestly that's the most self-aware thing about them.`);
  pool.push(`I've seen **${p.username}**'s profile and I have concerns. Not many. Just concerns.`);
  pool.push(`**${p.username}** existing on Discord is a choice. Using this command is another choice. Both are questionable.`);
  pool.push(`**${p.username}** really woke up today and decided this was going to be their arc. Respect the commitment to the bit.`);
  pool.push(`The audacity of **${p.username}** to exist in a server and still act like this. Incredible. Unmatched.`);
  pool.push(`**${p.username}**'s whole vibe is "I peaked somewhere and I'm still looking for it." Keep searching king/queen.`);

  return getRandom(pool);
}

module.exports = { generateInsult };
