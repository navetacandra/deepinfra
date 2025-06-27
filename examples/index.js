const { getModels, generateCompletion, EventEmitter } = require('../dist/deepinfra.cjs');

; (async function () {
    console.log('---------- Get Available Models ----------');
    const models = await getModels();
    console.table(models.map(item => ({ model: item.full_name, short_name: item.name, max_tokens: item.maxTokens })));
    
    const messages = [
        { role: 'system', content: 'You are a poem writer.' },
        { role: 'user', content: 'Write a short haiku about the moon.' }
    ];
    
    console.log('\n\n---------- Basic Completion ----------');
    const completion = await generateCompletion(messages, {
        model: 'deepseek-ai/DeepSeek-V3',
    });
    console.log(completion);
    
    console.log('\n\n---------- Stream Completion ----------');
    const streamController = new EventEmitter();
    streamController.on('completion', chunk => process.stdout.write(chunk));
    await generateCompletion(messages, {
        model: 'deepseek-ai/DeepSeek-V3',
    }, streamController);
    process.stdout.write('\n');

    console.log('\n\n---------- Custom Request Function Completion ----------');
    const customRequestFunctionCompletion = await generateCompletion(messages, {
        model: 'deepseek-ai/DeepSeek-V3',
        request: (input, init) => {
            console.log(`Send request to ${input}`);
            return fetch(input, init);
        }
    });
    console.log(customRequestFunctionCompletion);
})();
