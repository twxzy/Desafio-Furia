// Espera o DOM estar completamente carregado
document.addEventListener('DOMContentLoaded', () => {

    // Elementos do DOM
    const chatButton = document.getElementById('chat-button');
    const chatWindow = document.getElementById('chat-window');
    const closeChatBtn = document.getElementById('close-chat-btn');
    const chatBody = document.getElementById('chat-body');
    const chatInputArea = document.getElementById('chat-input-area');
    const chatInput = document.getElementById('chat-input');
    const sendChatBtn = document.getElementById('send-chat-btn');
    const clearChatBtn = document.getElementById('clear-chat-btn');
    const loadingMessage = document.getElementById('loading-message');

    // Variáveis de estado
    let chatbotData = null;
    let isLoadingData = false;
    let currentNodeId = 'start';
    let currentGameContext = null;
    let isProcessing = false;

    // Verifica se elementos essenciais existem
    if (!chatButton || !chatWindow || !closeChatBtn || !chatBody || !chatInputArea || !chatInput || !sendChatBtn || !clearChatBtn || !loadingMessage) {
        console.error("Erro: Elemento(s) do Chat não encontrado(s) no HTML.");
        if (chatButton) chatButton.style.display = 'none';
        return; // Interrompe a execução
    }

    // Estrutura da conversa (nós, mensagens, opções)
    const chatTree = {
        'start': {
            messages: ["E aí! 🐾 Pronto(a) para ficar por dentro da FURIA? #DIADEFURIA", "Assistente FURIA na área! Qual a boa? Mande sua pergunta ou escolha uma opção. 🚀", "#DIADEFURIA! Como posso te ajudar hoje sobre a maior do Brasil? Escolha abaixo ou digite!"],
            options: [{ text: "Sobre a FURIA", next: "about_furia" }, { text: "Nossas Modalidades", next: "list_teams" }, { text: "Loja Oficial", next: "store" }, { text: "Redes Sociais", next: "follow" }]
        },
        'about_furia': {
            message: "A FURIA é uma organização brasileira de esports fundada em 2017...",
            options: [{ text: "Ver Modalidades", next: "list_teams" }]
        },
        'list_teams': {
            message: "Atualmente, a FURIA compete em alto nível nestas modalidades...",
            dynamic_options_from_data: true // Indica que opções vêm dos dados carregados
        },
        'show_team_menu': {
            message: "Você selecionou {game_name}. O que deseja saber?",
            options_from_context: true // Indica que opções dependem do contexto (jogo)
        },
        'show_roster': {
            message: "A escalação atual de {game_name} é:",
            result_template: "<p>{roster_info}</p>", // Template com placeholder
            quick_replies_from_context: ['schedule', 'achievements']
        },
        'show_schedule': {
            message: "Para ver a agenda e resultados de {game_name}:",
            result_template: `<p>Confira no <a href="{schedule_link}" target="_blank" rel="noopener noreferrer">{schedule_source}</a>.</p>`,
            quick_replies_from_context: ['roster', 'achievements']
        },
        'show_achievements': {
            message: "Algumas conquistas importantes de {game_name}:",
            result_template: "<ul style='list-style: disc; padding-left: 20px; margin:0;'>{achievements_list}</ul>",
            quick_replies_from_context: ['roster', 'schedule']
        },
        'store': {
            message: "Vista o manto da Pantera! Produtos oficiais te esperam na FURIA Store.",
            result: '<p>Acesse a <a href="https://furiastore.com/" target="_blank" rel="noopener noreferrer">FURIA Store Oficial</a>!</p>',
            options: []
        },
        'follow': {
            message: "Siga a pantera e não perca nada:",
            result: `<div class="social-links-container"> <div class="social-link"> <a href="https://twitter.com/furia" target="_blank" rel="noopener noreferrer" title="Twitter/X"> <i class="bi bi-twitter-x"></i> </a> </div> <div class="social-link"> <a href="https://www.instagram.com/furia/" target="_blank" rel="noopener noreferrer" title="Instagram"> <i class="bi bi-instagram"></i> </a> </div> <div class="social-link"> <a href="https://www.facebook.com/furiagg" target="_blank" rel="noopener noreferrer" title="Facebook"> <i class="bi bi-facebook"></i> </a> </div> <div class="social-link"> <a href="https://www.youtube.com/furiatv" target="_blank" rel="noopener noreferrer" title="YouTube"> <i class="bi bi-youtube"></i> </a> </div> <div class="social-link"> <a href="https://www.twitch.tv/furiatv" target="_blank" rel="noopener noreferrer" title="Twitch"> <i class="bi bi-twitch"></i> </a> </div> </div> `,
            options: []
        },
        'fallback': {
            message: "Desculpe, não entendi bem. 🤔 Poderia tentar outras palavras...",
            options: [{ text: "Ver Modalidades", next: "list_teams" }, { text: "Ir para o Início", next: "start", is_go_home: true }]
        }
    };

    // Mapeamento de palavras-chave para nós da conversa
    const keywordMap = { 'lineup': 'show_roster', 'escalacao': 'show_roster', 'time': 'show_team_menu', 'agenda': 'show_schedule', 'jogos': 'show_schedule', 'conquistas': 'show_achievements', 'csgo': 'show_team_menu', 'cs': 'show_team_menu', 'valorant': 'show_team_menu', 'val masc': 'show_team_menu', 'val fem': 'show_team_menu', 'valorant gc': 'show_team_menu', 'lol': 'show_team_menu', 'rl': 'show_team_menu', 'r6': 'show_team_menu', 'sobre': 'about_furia', 'historia': 'about_furia', 'times': 'list_teams', 'modalidades': 'list_teams', 'loja': 'store', 'redes': 'follow', 'social': 'follow', 'inicio': 'start', 'voltar': 'start', 'oi': 'start' };

    // Mapeamento de nomes/apelidos de jogos para chaves usadas nos dados
    const gameIdMap = { 'csgo': 'csgo', 'cs go': 'csgo', 'counter strike': 'csgo', 'cs': 'csgo', 'valorant masc': 'valorant', 'valorant masculino': 'valorant', 'val masc': 'valorant', 'valorant fem': 'valorant_gc', 'valorant feminino': 'valorant_gc', 'valorant gc': 'valorant_gc', 'game changers': 'valorant_gc', 'val fem': 'valorant_gc', 'val gc': 'valorant_gc', 'valorant': 'valorant', 'lol': 'lol', 'league of legends': 'lol', 'cblol': 'lol', 'rl': 'rl', 'rocket league': 'rl', 'r6': 'r6', 'rainbow six': 'r6', 'rainbow 6': 'r6', 'siege': 'r6' };


    // Carrega dados externos do chatbot (JSON)
    async function loadChatbotData() {
        if (chatbotData || isLoadingData) return chatbotData != null;
        isLoadingData = true;
        // Caminho para o arquivo de dados. Verifique se está correto.
        const dataFilePath = 'data/chatbot-data.json';

        const needsLoadingMsg = !chatWindow.classList.contains('hidden') && !chatBody.querySelector('#loading-message');
        if (needsLoadingMsg) {
            loadingMessage.style.display = 'block';
            loadingMessage.textContent = "Carregando dados...";
            if (!chatBody.contains(loadingMessage)) {
                chatBody.appendChild(loadingMessage);
            }
            scrollToBottom();
        }

        try {
            const response = await fetch(dataFilePath);
            if (!response.ok) throw new Error(`Erro HTTP ${response.status} ao buscar ${response.url}`);
            chatbotData = await response.json();
            if (loadingMessage.parentNode === chatBody) chatBody.removeChild(loadingMessage);
            updateStartNodeWithOptions(); // Atualiza opções iniciais se no nó 'start'
            return true;
        } catch (error) {
            console.error(`Erro ao carregar ou parsear dados de ${dataFilePath}:`, error);
            if (loadingMessage.parentNode === chatBody) {
                loadingMessage.textContent = "Erro ao carregar dados.";
                loadingMessage.style.color = 'red';
            } else if (!chatWindow.classList.contains('hidden')) {
                displaySimpleBotMessage("Falha ao carregar dados necessários.");
            }
            chatbotData = null;
            return false;
        } finally {
            isLoadingData = false;
        }
    }

    // Abre a janela do chat
    async function openChat() {
        chatWindow.classList.remove('hidden');
        chatButton.classList.add('hidden');
        loadNode('start'); // Carrega nó inicial primeiro
        if (!chatbotData && !isLoadingData) {
            loadChatbotData(); // Inicia carregamento em background
        } else if (chatbotData) {
            updateStartNodeWithOptions(); // Atualiza opções se dados já carregados
        }
        setTimeout(() => chatInput.focus(), 300);
    }

    // Fecha a janela do chat
    function closeChat() {
        chatWindow.classList.add('hidden');
        chatButton.classList.remove('hidden');
    }

    // Limpa a conversa e reinicia
    function clearChat() {
        chatBody.innerHTML = ''; // Remove mensagens

        // Reseta estado da mensagem de loading
        loadingMessage.style.display = 'none';
        loadingMessage.style.color = '';
        loadingMessage.textContent = 'Carregando dados...';
        chatBody.appendChild(loadingMessage); // Adiciona de volta (oculta)

        currentNodeId = 'start';
        currentGameContext = null;
        isProcessing = false;
        loadNode('start'); // Carrega nó inicial
        if (!chatbotData && !isLoadingData) {
            loadChatbotData(); // Recarrega dados se necessário
        }
    }

    // Mostra o indicador de digitação
    function showTypingIndicator() {
        if (chatBody.querySelector('.typing-indicator')) return;
        const indicator = document.createElement('div');
        indicator.classList.add('typing-indicator');
        indicator.innerHTML = '<span></span><span></span><span></span>';
        chatBody.appendChild(indicator); // Adiciona diretamente ao body
        scrollToBottom();
    }

    // Remove o indicador de digitação
    function removeTypingIndicator() {
        const indicator = chatBody.querySelector('.typing-indicator');
        if (indicator && chatBody.contains(indicator)) {
            chatBody.removeChild(indicator);
        }
    }

    // Rola a janela para baixo
    function scrollToBottom() {
        requestAnimationFrame(() => {
            if (chatBody) chatBody.scrollTop = chatBody.scrollHeight;
        });
    }

    // Adiciona um bloco completo de mensagem do bot (texto + resultado HTML)
    function addBotMessageBlock(htmlBlockContent) {
        if (!htmlBlockContent || htmlBlockContent.trim() === '') return;

        const messageContainer = document.createElement('div');
        messageContainer.classList.add('chat-message', 'message-bot'); // Classes para estilização bot

        const messageContentDiv = document.createElement('div');
        messageContentDiv.classList.add('message-content');
        messageContentDiv.innerHTML = htmlBlockContent; // Usa innerHTML para processar HTML

        messageContainer.appendChild(messageContentDiv);

        // Remove a mensagem de loading antes de adicionar a nova
        if (loadingMessage.parentNode === chatBody) {
            chatBody.removeChild(loadingMessage);
        }
        chatBody.appendChild(messageContainer);
    }

    // Exibe uma mensagem simples do bot (erros, loading, etc.)
    function displaySimpleBotMessage(text) {
        const element = document.createElement('div');
        element.classList.add('chat-message', 'message-bot', 'message-simple'); // Classes para bot e mensagem simples

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.textContent = text; // Usa textContent por segurança

        element.appendChild(contentDiv);

        // Remove mensagem de loading
        if (loadingMessage.parentNode === chatBody) {
            chatBody.removeChild(loadingMessage);
        }
        chatBody.appendChild(element);
        scrollToBottom();
    }

    // Exibe a mensagem do usuário
    function displayUserMessage(textContent) {
        const element = document.createElement('div');
        element.classList.add('chat-message', 'message-user'); // Classes para usuário

        const contentDiv = document.createElement('div');
        contentDiv.classList.add('message-content');
        contentDiv.textContent = textContent; // Usa textContent

        element.appendChild(contentDiv);

        clearButtons('.chat-options-container'); // Remove botões anteriores
        clearButtons('.quick-replies-container');
        removeTypingIndicator();

        chatBody.appendChild(element);
        scrollToBottom();
    }

    // Carrega um nó da árvore de conversa
    function loadNode(nodeId, isUserAction = false) {
        if (isProcessing) return;
        isProcessing = true;

        // Mostra indicador, exceto no início do chat ou ao reiniciar
        if (nodeId !== 'start' || chatBody.children.length > 1) {
            showTypingIndicator();
        }

        const targetNode = chatTree[nodeId];
        if (!targetNode) {
            console.error(`Erro: Nó '${nodeId}' não encontrado no chatTree.`);
            displaySimpleBotMessage("Desculpe, houve um problema.");
            isProcessing = false;
            removeTypingIndicator();
            return;
        }

        // Verifica se dados são necessários e inicia carregamento se preciso
        const needsDataNow = targetNode.dynamic_options_from_data || (nodeId === 'list_teams') || targetNode.options_from_context || targetNode.result_template || targetNode.quick_replies_from_context || messageNeedsData(targetNode);
        if (needsDataNow && !chatbotData && !isLoadingData) {
            console.warn(`Nó '${nodeId}' precisa de dados. Iniciando carregamento...`);
            removeTypingIndicator();
            displaySimpleBotMessage("Buscando informações...");
            loadChatbotData().then(loaded => {
                // Remove a mensagem "Buscando..."
                const seekingMsg = Array.from(chatBody.querySelectorAll('.message-simple .message-content')).find(el => el.textContent.includes("Buscando informações..."));
                if (seekingMsg) seekingMsg.closest('.chat-message')?.remove();

                if (loaded) {
                    loadNode(nodeId, isUserAction); // Tenta carregar o nó novamente
                } else {
                    isProcessing = false;
                }
            }).catch((error) => {
                console.error("Erro ao tentar carregar dados e recarregar nó:", error);
                isProcessing = false;
                const seekingMsg = Array.from(chatBody.querySelectorAll('.message-simple .message-content')).find(el => el.textContent.includes("Buscando informações..."));
                if (seekingMsg) seekingMsg.closest('.chat-message')?.remove();
                displaySimpleBotMessage("Erro ao buscar dados. Tente novamente mais tarde.");
            });
            return; // Sai da função até que o carregamento termine
        } else if (needsDataNow && !chatbotData && isLoadingData) {
             console.log("Dados necessários, mas já carregando. Aguardando...");
             isProcessing = false; // Permite nova interação enquanto carrega
             return;
        }


        // Processamento do nó com delay
        setTimeout(() => {
            try {
                removeTypingIndicator();
                currentNodeId = nodeId; // Atualiza nó atual

                let messageText = targetNode.message || (targetNode.messages ? targetNode.messages[Math.floor(Math.random() * targetNode.messages.length)] : '');
                let resultHtml = targetNode.result || '';
                let optionsBase = targetNode.options ? JSON.parse(JSON.stringify(targetNode.options)) : [];
                let quickRepliesBase = targetNode.quick_replies ? JSON.parse(JSON.stringify(targetNode.quick_replies)) : [];

                // Lógica de contexto de jogo
                if (['start', 'list_teams', 'about_furia', 'store', 'follow', 'fallback'].includes(nodeId)) {
                    if (currentGameContext) {
                        currentGameContext = null;
                    }
                }
                let gameKey = targetNode.game_key || currentGameContext;
                let gameData = gameKey && chatbotData ? chatbotData[gameKey] : null;
                if (nodeId === 'show_team_menu' && gameKey && gameKey !== currentGameContext) {
                    currentGameContext = gameKey;
                    gameData = chatbotData ? chatbotData[currentGameContext] : null;
                }

                // Constrói o conteúdo HTML do bloco de mensagem do bot
                let finalHtmlBlock = '';

                // Preenche templates e mensagem principal
                if (gameData) {
                    messageText = fillTemplate(messageText, gameData);
                    if (targetNode.result_template) {
                        resultHtml = fillTemplate(targetNode.result_template, gameData);
                         // Tratamento específico para lista de conquistas e escalação
                         if (resultHtml.includes("{achievements_list}")) {
                             const achievements = gameData.achievements || [];
                             const listItems = achievements.length > 0 ? achievements.map(a => `<li>${a}</li>`).join('') : "<li>Nenhuma conquista principal registrada.</li>";
                             resultHtml = resultHtml.replace("{achievements_list}", listItems);
                         }
                         if (resultHtml.includes("{roster_info}")) {
                             const rosterInfo = gameData.roster_info || "Informação da escalação não disponível.";
                             resultHtml = resultHtml.replace("{roster_info}", rosterInfo);
                         }
                    }
                } else if ((targetNode.result_template || messageNeedsData(targetNode)) && gameKey && !gameData) {
                    // Se precisa de dados do jogo mas não encontrou
                    messageText = `Informações para '${gameKey}' indisponíveis no momento.`;
                    resultHtml = '';
                }

                if (messageText) {
                    finalHtmlBlock += `<p class="message-text-content">${messageText}</p>`;
                }

                // Adiciona Resultado HTML
                if (resultHtml) {
                    finalHtmlBlock += `<div class="message-result-content">${resultHtml}</div>`;
                }

                // Define opções finais (dinâmicas, contexto ou estáticas)
                let finalOptions = [];
                if (targetNode.dynamic_options_from_data && nodeId === 'list_teams' && chatbotData) {
                    finalOptions = Object.keys(chatbotData).map(key => ({
                        text: chatbotData[key].name || key,
                        next: 'show_team_menu',
                        game_key: key
                    }));
                    finalOptions.sort((a, b) => a.text.localeCompare(b.text)); // Ordena por nome do jogo
                } else if (targetNode.options_from_context && gameKey) {
                    finalOptions = [
                        { text: `Line-up`, next: 'show_roster', game_key: gameKey },
                        { text: `Agenda`, next: 'show_schedule', game_key: gameKey },
                        { text: `Conquistas`, next: 'show_achievements', game_key: gameKey },
                        { text: `Voltar p/ Modalidades`, next: 'list_teams' } // Botão para voltar
                    ];
                } else {
                    finalOptions = optionsBase;
                }

                // Define Quick Replies finais
                let finalQuickReplies = [];
                if (targetNode.quick_replies_from_context && gameKey && gameData) {
                    finalQuickReplies = targetNode.quick_replies_from_context.map(type => {
                        let txt = '', nxt = '';
                        if (type === 'roster') { txt = 'Line-up'; nxt = 'show_roster'; }
                        else if (type === 'schedule') { txt = 'Agenda'; nxt = 'show_schedule'; }
                        else if (type === 'achievements') { txt = 'Conquistas'; nxt = 'show_achievements'; }
                        return txt ? { text: txt, next: nxt, game_key: gameKey } : null;
                    }).filter(Boolean);
                } else if (targetNode.quick_replies) {
                    finalQuickReplies = quickRepliesBase;
                }

                // Limpa botões antes de adicionar novos
                clearButtons('.chat-options-container');
                clearButtons('.quick-replies-container');

                // Exibe o bloco de mensagem
                addBotMessageBlock(finalHtmlBlock);

                // Adiciona opção "Início" (se não for start e não existir)
                const hasGoToStart = finalOptions.some(opt => opt.next === 'start' || opt.is_go_home);
                if (nodeId !== 'start' && !hasGoToStart) {
                    const backToListIdx = finalOptions.findIndex(opt => opt.next === 'list_teams');
                    const startOption = { text: "« Início", next: "start", is_go_home: true };
                    if (backToListIdx !== -1) {
                        finalOptions.splice(backToListIdx + 1, 0, startOption); // Insere após "Voltar p/ Modalidades"
                    } else {
                        finalOptions.push(startOption); // Adiciona no final
                    }
                }

                // Adiciona Opções e Quick Replies
                if (finalOptions.length > 0) addOptions(finalOptions);
                if (finalQuickReplies.length > 0) addQuickReplies(finalQuickReplies);

                scrollToBottom();

            } catch (error) {
                console.error(`Erro processando nó ${nodeId}:`, error);
                removeTypingIndicator();
                displaySimpleBotMessage("Ocorreu um erro interno.");
            } finally {
                isProcessing = false;
            }
        }, 150 + Math.random() * 150); // Delay simulando digitação

    }


    // Verifica se um nó precisa de dados externos
    function messageNeedsData(node) {
        const msg = node.message || (node.messages ? node.messages.join(' ') : '');
        const res = node.result_template || node.result || '';
        const placeholderRegex = /\{([^{}]+)\}/g; // Busca por {qualquer_coisa}
        return placeholderRegex.test(msg) || placeholderRegex.test(res);
    }

    // Preenche placeholders em uma string com dados
    function fillTemplate(templateString, data) {
        if (!templateString || typeof templateString !== 'string' || !data) return templateString;

        return templateString.replace(/\{(\w+)\}/g, (match, key) => {
            // Substitui chaves específicas (game_name, links, etc.)
            if (key === 'game_name') return data.name || key;
            if (key === 'roster_info') return data.roster_info || "Escalação não disponível.";
            if (key === 'schedule_link') return data.schedule_link || '#';
            if (key === 'schedule_source') return data.schedule_source || 'fonte oficial';

            // achievement_list é tratado em loadNode
            if (key === 'achievements_list') return match;

            // Para outras chaves nos dados, escapa HTML por segurança
            if (data.hasOwnProperty(key) && data[key] !== undefined) {
                 // Chaves que podem conter HTML seguro (confirmar se necessário)
                 if (['roster_info', 'schedule_link'].includes(key)) {
                      return String(data[key]); // Permite HTML
                 } else {
                      // Escapa HTML para a maioria das chaves
                      const tempDiv = document.createElement('div');
                      tempDiv.textContent = String(data[key]);
                      return tempDiv.innerHTML;
                 }
            }

            // Retorna o placeholder original se a chave não for encontrada nos dados
            return match;
        });
    }

    // Remove contêineres de botões
    function clearButtons(containerSelector) {
        const container = chatBody.querySelector(containerSelector);
        if (container && chatBody.contains(container)) {
            chatBody.removeChild(container);
        }
    }

    // Adiciona botões de opções
    function addOptions(options) {
        if (!options || options.length === 0) return;

        clearButtons('.chat-options-container'); // Limpa antes de adicionar

        const optionsContainer = document.createElement('div');
        optionsContainer.classList.add('chat-options-container');

        options.forEach(optionData => {
            // Oculta opção de modalidades no início se dados não carregados
            if (optionData.next === 'list_teams' && currentNodeId === 'start' && !chatbotData) {
                 return; // Pula a adição deste botão
            }

            const button = createButton(optionData, ['chat-option']);
            if (button) { // Verifica se o botão foi criado
                if (optionData.is_go_home) button.classList.add('chat-option-gohome');
                optionsContainer.appendChild(button);
            }
        });

        if (optionsContainer.hasChildNodes()) {
            chatBody.appendChild(optionsContainer);
        }
    }

    // Adiciona botões de quick replies
    function addQuickReplies(quickReplies) {
        if (!quickReplies || quickReplies.length === 0) return;

        clearButtons('.quick-replies-container'); // Limpa antes de adicionar

        const qrContainer = document.createElement('div');
        qrContainer.classList.add('quick-replies-container');

        quickReplies.forEach(qrData => {
            const button = createButton(qrData, ['quick-reply-button']);
             if (button) { // Verifica se o botão foi criado
                qrContainer.appendChild(button);
             }
        });

        if (qrContainer.hasChildNodes()) {
            chatBody.appendChild(qrContainer);
        }
    }

    // Cria um botão interativo
    function createButton(buttonData, cssClasses = []) {
        if (!buttonData?.text || !buttonData?.next) {
            console.warn("Dados inválidos para criar botão:", buttonData);
            return null;
        }

        const button = document.createElement('button');
        button.classList.add(...cssClasses);
        button.textContent = buttonData.text;
        button.dataset.next = buttonData.next;
        if (buttonData.game_key) button.dataset.game_key = buttonData.game_key;

        button.addEventListener('click', () => {
            if (isProcessing) {
                console.log("Botão clicado, mas processando. Ignorado.");
                return;
            }
            console.log(`Botão clicado: ${buttonData.text}`);

            // Remove botões imediatamente ao clicar
            clearButtons('.chat-options-container');
            clearButtons('.quick-replies-container');

            const nextNodeId = button.dataset.next;
            const gameKeyFromButton = button.dataset.game_key;

            // Define o contexto antes de carregar o nó
            if (gameKeyFromButton) {
                currentGameContext = gameKeyFromButton;
            }

            loadNode(nextNodeId, true); // Ação do usuário
        });

        return button;
    }

    // Processa a entrada de texto do usuário
    function processUserInput(inputText) {
        const cleanedInput = inputText.trim().toLowerCase();
        if (!cleanedInput) return false;

        displayUserMessage(cleanedInput); // Exibe mensagem do usuário

        chatInput.value = ''; // Limpa input
        chatInput.focus();

        let matchedNodeId = null;
        let specificGameKey = null;

        const sortedGameKeywords = Object.keys(gameIdMap).sort((a, b) => b.length - a.length);
        const actionKeywords = Object.keys(keywordMap).filter(k => ['show_roster', 'show_schedule', 'show_achievements'].includes(keywordMap[k])).sort((a, b) => b.length - a.length);

        // 1. Busca JOGO + AÇÃO
        for (const gameKeyword of sortedGameKeywords) {
            if (cleanedInput.includes(gameKeyword)) {
                specificGameKey = gameIdMap[gameKeyword];
                for (const actionKeyword of actionKeywords) {
                    if (cleanedInput.includes(actionKeyword)) {
                        matchedNodeId = keywordMap[actionKeyword];
                        break; // Achou ação para o jogo
                    }
                }
                if (matchedNodeId) break; // Achou jogo+ação
                matchedNodeId = 'show_team_menu'; // Achou só o jogo
                break;
            }
        }

        // 2. Se não achou JOGO + AÇÃO ou só JOGO, e TEM CONTEXTO, tenta AÇÃO no CONTEXTO
        if (!matchedNodeId && currentGameContext) {
             for (const actionKeyword of actionKeywords) {
                 if (cleanedInput.includes(actionKeyword)) {
                     matchedNodeId = keywordMap[actionKeyword];
                     specificGameKey = currentGameContext; // Usa contexto atual
                     break;
                 }
             }
        }

        // 3. Se não achou, tenta PALAVRAS-CHAVE GERAIS
        if (!matchedNodeId) {
            const sortedGeneralKeywords = Object.keys(keywordMap)
                .filter(k => !gameIdMap[k] && !actionKeywords.includes(k))
                .sort((a, b) => b.length - a.length);

            for (const keyword of sortedGeneralKeywords) {
                if (cleanedInput.includes(keyword)) {
                    matchedNodeId = keywordMap[keyword];
                    specificGameKey = null; // Intenção geral, limpa contexto da entrada
                    break;
                }
            }
        }

        // Carrega o nó ou fallback
        if (matchedNodeId) {
            // Define o contexto antes de carregar o nó se um jogo foi identificado na entrada
            if (specificGameKey) {
                currentGameContext = specificGameKey;
            } else if (['start', 'list_teams', 'about_furia', 'store', 'follow'].includes(matchedNodeId)) {
                 // Limpa contexto para intenções gerais que não dependem de jogo
                 if (currentGameContext) {
                     currentGameContext = null;
                 }
            }

            loadNode(matchedNodeId, true); // true indica ação do usuário
            return true;
        } else {
            loadNode('fallback', true);
            return false;
        }
    }

    // Lida com o evento de enviar mensagem (botão ou Enter)
    function handleSendMessage() {
        const text = chatInput.value;
        if (text.trim() === '' || isProcessing || isLoadingData) {
             return; // Ignora entrada vazia ou se ocupado
        }
        processUserInput(text);
    }

    // Atualiza opções iniciais com botão de modalidades após carregar dados
    function updateStartNodeWithOptions() {
        if (currentNodeId === 'start' && chatbotData) {
            const optionsContainer = chatBody.querySelector('.chat-options-container');
            if (optionsContainer) {
                let alreadyExists = false;
                optionsContainer.querySelectorAll('.chat-option').forEach(button => {
                    if (button.dataset.next === 'list_teams') {
                        alreadyExists = true;
                    }
                });

                if (!alreadyExists) {
                    const startNodeDef = chatTree['start'];
                    const modOptionData = startNodeDef.options.find(opt => opt.next === 'list_teams');

                    if (modOptionData) {
                         const modButton = createButton(modOptionData, ['chat-option']);
                         if (modButton) { // Verifica se o botão foi criado
                             const aboutBtn = optionsContainer.querySelector('button[data-next="about_furia"]');
                             if (aboutBtn && aboutBtn.parentNode === optionsContainer) {
                                 optionsContainer.insertBefore(modButton, aboutBtn.nextSibling);
                             } else {
                                 optionsContainer.insertBefore(modButton, optionsContainer.firstChild);
                             }
                             scrollToBottom();
                         }
                    }
                }
            }
        }
    }

    // Event Listeners
    chatButton.addEventListener('click', openChat);
    closeChatBtn.addEventListener('click', closeChat);
    clearChatBtn.addEventListener('click', clearChat);
    sendChatBtn.addEventListener('click', handleSendMessage);
    chatInput.addEventListener('keypress', (event) => {
        if (event.key === 'Enter' && !event.shiftKey) { // Envia com Enter, exceto Shift+Enter
            event.preventDefault();
            handleSendMessage();
        }
    });

}); // Fim do DOMContentLoaded