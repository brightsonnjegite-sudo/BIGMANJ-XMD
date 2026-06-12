case "menu": {
    await reaction(m.chat, "🚀")
    
    const totalMem = os.totalmem()
    const freeMem = os.freemem()
    const usedMem = totalMem - freeMem
    const ramPercent = Math.round((usedMem / totalMem) * 100)
    const ramBar = "█".repeat(Math.round(ramPercent / 10)) + "░".repeat(10 - Math.round(ramPercent / 10))
    let timestamp = speed()
    let latensi = speed() - timestamp

    // Use your existing random image from menuImages array
    const randomImage = getRandomImage()

    // Clean, modern menu caption (no ugly boxes, no broken characters)
    const menuCaption = 
`⚠️ *ДОСТУП РАЗРЕШЁН* ⚠️
*BIGMANJ BOT V3*
Скорость выше предела. Интеллект без границ. Мощь нового поколения.
*СТАТУС:* АКТИВЕН   *РЕЖИМ:* ЭЛИТА

${getGreeting()} @${pushname}

📌 *User Info*
• Status: ${isOwner ? "Owner" : isSeller ? "Seller" : "User"}
• Name: @${pushname}
• Prefix: .

📌 *Bot Info*
• Speed: ${latensi.toFixed(4)} ms
• Uptime: ${runtime(process.uptime())}
• Commands: 200+
• Ram: [${ramBar}] ${ramPercent}%
• Date: ${new Date().toLocaleString()}

📌 *Sub‑menus*
• .menu-ai-chat
• .menu-ai-generator
• .menu-ai-misc
• .menu-owner
• .menu-group
• .menu-search
• .menu-stalker
• .menu-info
• .menu-tool
• .menu-download
• .menu-anime
• .menu-maker
• .menu-converter
• .menu-qur'an
• .menu-bug
• .menu-all

~bigmanj tech~
© bigmanj tech ™
~*BIGMANJ BOT V3*~ by ~*© bigmanj tech ™ with ♥︎*~`

    // Send the button message with image and caption
    await sendButtonV2(m, client, fquoted, {
        title: "bigmanj biggest",
        subtitle: "BIGMANJ bot by bigmanj tech ™",
        imageUrl: randomImage,
        body: menuCaption,
        footer: "© BIGMANJ bot v8.0.3 — by bigmanj tech ™",
        buttons: [
            { text: "BIG Store", id: ".storemenu" },
            { text: "Team Support", id: ".teamsupport" }
        ]
    })

    // Send the audio as a regular MP3 (not voice note)
    await client.sendMessage(m.chat, {
        audio: { url: menuMusic },
        mimetype: "audio/mpeg",
        ptt: false   // regular playable audio, not voice note
    }, { quoted: fquoted.doc })
}
break