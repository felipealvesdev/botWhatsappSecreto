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
                selectedMenu: null,
                cityName: null,
                name: null,
                dateOfBirth: null,
                selectedSubMenu: null,
                id: null
            };
        }

        handleStage(client, message, users[user]);
    });
}

async function handleStage(client, message, user) {
    switch (user.stage) {
        case 0:
            await client.sendText(message.from, 'Olá! Escolha uma opção:\n1: Saber mais informações sobre este bot\n2: Ver a temperatura em uma cidade\n3: Fazer pedido de pizza\n4: Digitar informações pessoais');
            user.stage = 1;
            break;
        case 1:
            user.selectedMenu = message.body;
            switch (user.selectedMenu) {
                case '1':
                    await client.sendText(message.from, 'Olá! Sou um bot do Secret no WhatsApp. Em breve estarei recebendo novas atualizações para melhor atendê-lo.');
                    await client.sendText(message.from, 'Este é o nosso endereço:');

                    try {
                        await client.sendLocation(message.from, '-8.063169', '-34.871139', 'Marco Zero - Recife Antigo, Pernambuco');
                    } catch (error) {
                        console.error('Erro ao enviar a localização:', error);
                    }
                    await client.sendImage(message.from, 'https://img.freepik.com/fotos-gratis/close-up-em-uma-deliciosa-pizza_23-2150852113.jpg?size=626&ext=jpg&ga=GA1.1.1141335507.1718236800&semt=sph', 'pizza.jpg', 'Aqui está uma deliciosa pizza!');
                    await client.sendText(message.from, 'Entre em contato conosco. Estamos à sua disposição. Obrigado.');
                    user.stage = 0;
                    break;
                case '2':
                    await client.sendText(message.from, 'Por favor, informe o nome da cidade que você gostaria de saber a temperatura.');
                    user.stage = 2;
                    break;
                case '3':
                    await client.sendText(message.from, 'Qual pizza você gostaria de pedir?');
                    user.stage = 4;
                    break;
                case '4':
                    await client.sendText(message.from, 'Escolha uma opção:\n1: Listar informações\n2: Adicionar informações\n3: Atualizar informações\n4: Excluir informações');
                    user.stage = 9;
                    break;
                default:
                    await client.sendText(message.from, 'Opção inválida. Por favor, escolha uma opção válida:\n1: Saber mais informações sobre este bot\n2: Ver a temperatura em uma cidade\n3: Fazer pedido de pizza\n4: Digitar informações pessoais');
                    user.stage = 1;
                    break;
            }
            break;
        case 2:
            user.cityName = message.body;
            await client.sendText(message.from, `Aguarde um momento enquanto buscamos a temperatura de ${user.cityName}.`);
            try {
                const apiKey = `456165af1a0e7545d7d46530a7190936`;
                const url = `https://api.openweathermap.org/data/2.5/weather?q=${user.cityName}&appid=${apiKey}`;

                const response = await axios.get(url);
                const data = response.data;
                const tempCelsius = (data.main.temp - 273.15).toFixed(2);

                await client.sendText(message.from, `A temperatura atual em ${user.cityName.toUpperCase()} é ${tempCelsius}°C.`);
                user.stage = 0;
            } catch (error) {
                await client.sendText(message.from, 'Desculpe, houve um problema ao buscar a temperatura. Tente novamente mais tarde.');
                user.stage = 0;
            }
            break;
        case 4:
            user.order = message.body;
            await client.sendText(message.from, 'Qual é o seu endereço para entrega?');
            user.stage = 5;
            break;
        case 5:
            user.address = message.body;
            await client.sendText(message.from, 'Quanto você tem para pagar pelo pedido?');
            user.stage = 6;
            break;
        case 6:
            user.payment = message.body;
            await client.sendText(message.from, `Resumo do pedido:\n- Pizza: ${user.order}\n- Endereço: ${user.address}\n- Pagamento: ${user.payment}\n\nObrigado pelo seu pedido!`);
            user.stage = 0;
            break;
        case 7:
            user.name = message.body;
            await client.sendText(message.from, 'Por favor, digite sua data de nascimento (YYYY-MM-DD):');
            user.stage = 8;
            break;
        case 8:
            user.dateOfBirth = message.body;
            try {
                await axios.post('http://localhost:8080/authors', {
                    name: user.name,
                    dateOfBirth: user.dateOfBirth
                });
                await client.sendText(message.from, `Obrigado! As informações foram enviadas:\n- Nome: ${user.name}\n- Data de Nascimento: ${user.dateOfBirth}. Por favor, confira no banco de dados para ter certeza de que os dados foram salvos.`);
            } catch (error) {
                await client.sendText(message.from, 'Desculpe, houve um problema ao enviar suas informações. Tente novamente mais tarde.');
            }
            user.stage = 0;
            break;
        case 9:
            user.selectedSubMenu = message.body;
            switch (user.selectedSubMenu) {
                case '1':
                    try {
                        const response = await axios.get('http://localhost:8080/authors');
                        const authors = response.data;
                        let authorsList = 'Lista de autores:\n';
                        authors.forEach((author, index) => {
                            authorsList += `${index + 1}. id: ${author.id} Nome: ${author.name}, Data de Nascimento: ${author.dateOfBirth}\n`;
                        });
                        await client.sendText(message.from, authorsList);
                    } catch (error) {
                        await client.sendText(message.from, 'Desculpe, houve um problema ao listar as informações. Tente novamente mais tarde.');
                    }
                    user.stage = 0;
                    break;
                case '2':
                    await client.sendText(message.from, 'Por favor, digite seu nome:');
                    user.stage = 7;
                    break;
                case '3':
                    await client.sendText(message.from, 'Por favor, digite o ID do autor que deseja atualizar:');
                    user.stage = 10;
                    break;
                case '4':
                    await client.sendText(message.from, 'Por favor, digite o ID do autor que deseja excluir:');
                    user.stage = 13;
                    break;
                default:
                    await client.sendText(message.from, 'Opção inválida. Por favor, escolha uma opção válida:\n1: Listar informações\n2: Adicionar informações\n3: Atualizar informações\n4: Excluir informações');
                    user.stage = 9;
                    break;
            }
            break;
        case 10:
            user.id = message.body;
            await client.sendText(message.from, 'Por favor, digite seu nome:');
            user.stage = 11;
            break;
        case 11:
            user.name = message.body;
            await client.sendText(message.from, 'Por favor, digite sua data de nascimento (YYYY-MM-DD):');
            user.stage = 12;
            break;
        case 12:
            user.dateOfBirth = message.body;
            try {
                await axios.put(`http://localhost:8080/authors/${user.id}`, {
                    name: user.name,
                    dateOfBirth: user.dateOfBirth
                });
                await client.sendText(message.from, `Obrigado! As informações foram atualizadas:\n- Nome: ${user.name}\n- Data de Nascimento: ${user.dateOfBirth}. Por favor, confira no banco de dados para ter certeza de que os dados foram salvos.`);
            } catch (error) {
                await client.sendText(message.from, 'Desculpe, houve um problema ao atualizar suas informações. Tente novamente mais tarde.');
                console.log(error);
            }
            user.stage = 0;
            break;
        case 13:
            user.id = message.body;
            try {
                await axios.delete(`http://localhost:8080/authors/${user.id}`);
                await client.sendText(message.from, `As informações do autor com ID ${user.id} foram excluídas com sucesso.`);
            } catch (error) {
                await client.sendText(message.from, 'Desculpe, houve um problema ao excluir as informações. Tente novamente mais tarde.');
            }
            user.stage = 0;
            break;
        default:
            await client.sendText(message.from, 'Desculpe, houve um erro no atendimento.');
            user.stage = 0;
            break;
    }
}
