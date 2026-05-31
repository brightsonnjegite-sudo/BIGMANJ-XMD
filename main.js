case userMessage === '.autourl':
case userMessage === '.audiourl':
    await autourlCommand.execute(sock, chatId, message);
    commandExecuted = true;
    break;