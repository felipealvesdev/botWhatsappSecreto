const venom = require('venom-bot');
const axios = require('axios');




venom.create({
    session: 'session-name'
    })
    .then((client) => {
        start(client);
        
        process.on('SIGINT', () => {
            client.close().then(() => {
                console.log('Bot fechado.');
                process.exit(0);
            }).catch((error) => {
                console.log('Erro ao fechar o bot: ', error);
                process.exit(1);
            });
        });
    
        process.on('SIGTERM', () => {
            client.close().then(() => {
                console.log('Bot fechado.');
                process.exit(0);
            }).catch((error) => {
                console.log('Erro ao fechar o bot: ', error);
                process.exit(1);
            });
        });


    })
    .catch((error) => {
        console.log(error);
    });

const start = (client) => {

    let users = {};

    client.onMessage((message) => {
        const user = message.from;

        if (!users[user]) {
        users[user] = {
            stage: 0,
            order: null,
            address: null,
            payment: null,
        };
        }

        handleStage(client, message, users[user]);
    });
}

async function handleStage(client, message, user) {
    switch (user.stage) {
    case 0:
        client.sendText(message.from, 'Olá! Aguarde um momento enquanto buscamos a temperatura de recife.');
        try {
            const cityName = "recife";
            const apiKey = `456165af1a0e7545d7d46530a7190936`;
            const url = `https://api.openweathermap.org/data/2.5/weather?q=${cityName}&appid=${apiKey}`;
                            


            const response = await axios.get(url);
            const data = response.data;
            const tempCelsius = (data.main.temp - 273.15).toFixed(2);
            

            client.sendText(message.from, `A temperatura atual em Recife é ${tempCelsius}°C.`);
            client.sendText(message.from, 'Qual pizza você gostaria de pedir?');
            user.stage++;
        } catch (error) {
            client.sendText(message.from, 'Desculpe, houve um problema ao buscar a temperatura. Tente novamente mais tarde.');
            user.stage = 0;
        }
        break;
    case 1:
        user.order = message.body;
        client.sendText(message.from, 'Qual é o seu endereço para entrega?');
        user.stage++;
        break;
    case 2:
        user.address = message.body;
        client.sendText(message.from, 'Quanto você tem para pagar pelo pedido?');
        user.stage++;
        break;
    case 3:
        user.payment = message.body;
        client.sendText(
        message.from,
        `Resumo do pedido:\n- Pizza: ${user.order}\n- Endereço: ${user.address}\n- Pagamento: ${user.payment}\n\nObrigado pelo seu pedido!`
        );
        user.stage = 0;
        break;
    default:
        client.sendText(message.from, 'Desculpe, houve um erro no atendimento.');
        user.stage = 0;
        break;
    }
}