const { Conversation } = require('../src');

(async () => {
  // With asynchronous completion
  const asyncConversation = new Conversation();
  await asyncConversation.init()
  asyncConversation.setModel(asyncConversation.models[1].model_name);
  console.log(await asyncConversation.completion('hello, who are you?'));

  // With streaming completion
  const conversation = new Conversation({ stream: true });
  await conversation.init()
  conversation.setModel(conversation.models[1].model_name);
  conversation.on('completion', data => process.stdout.write(data));
  await conversation.completion('hello, who are you?'); // wait response done

  // Conversation with system prompt
  const systemConversation = new Conversation({ history: [{ role: 'system', content: "You're a helpful assistant, named FuuBot."}] });
  await systemConversation.init()
  systemConversation.setModel(systemConversation.models[1].model_name);
  console.log(await systemConversation.completion('Hello, who are you?'));
})();
