// Coordenadas da Igreja de Nossa Sra. de Nazareth (Fallback)
//const coordIgrejaNazareth = [-22.93681853262829, -42.49264620972423];
const coordIgrejaNazareth = [-22.928393178257554, -42.49153075552434];

// Inicialização do Mapa (Padrão para a igreja, será atualizado pela geolocalização se permitida)
const mapa = L.map('mapa', {
    doubleClickZoom: false // Desativado para usarmos o duplo clique para criar pinos
}).setView(coordIgrejaNazareth, 15);

L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '© OpenStreetMap contributors'
}).addTo(mapa);

// Variável para armazenar o marcador do usuário
let marcadorMinhaLocalizacao = null;

// Função nativa do Leaflet para criar um ícone vermelho "limpo" (como alternativa ao emoji, caso precise)
const iconeVermelhoPadrao = new L.Icon({
    iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
    shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/0.7.7/images/marker-shadow.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowSize: [41, 41]
});

// Adicionar controle de Geolocalização (Leaflet nativo)
function centralizarNaMinhaLocalizacao() {
    const overlay = document.getElementById('overlayCarregamento');
    overlay.classList.remove('d-none'); // Mostrar overlay

    function animarParaEAdicionarPino(latLng, descricao) {
        overlay.classList.add('d-none'); // Esconder overlay
        mapa.flyTo(latLng, 16); // Voar suavemente em vez de pular (setView)

        // Se o marcador já existe, apenas move ele. Senão, cria um novo.
        if (marcadorMinhaLocalizacao) {
            marcadorMinhaLocalizacao.setLatLng(latLng);
            marcadorMinhaLocalizacao.getPopup().setContent(`<div><h6>📍 ${descricao}</h6></div>`);
        } else {
            marcadorMinhaLocalizacao = L.marker(latLng, { icon: iconeVermelhoPadrao }).addTo(mapa);
            marcadorMinhaLocalizacao.bindPopup(`<div><h6>📍 ${descricao}</h6></div>`);
        }
    }

    if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
            (position) => {
                const latLng = [position.coords.latitude, position.coords.longitude];
                animarParaEAdicionarPino(latLng, "Você está aqui!");
            },
            (error) => {
                overlay.classList.add('d-none'); // Esconder antes do alert
                alert("O navegador não conseguiu obter sua localização real (Erro: " + error.message + "). Pode ser falha de permissão ou do dispositivo. Redirecionando para o local padrão...");
                console.warn("Geolocalização negada ou falhou. Usando localização padrão (Igreja de N.S. Nazareth).", error);
                animarParaEAdicionarPino(coordIgrejaNazareth, "Localização atual (Padrão)");
            },
            { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 } // Desativado highAccuracy para funcionar melhor no PC onde não tem GPS real
        );
    } else {
        overlay.classList.add('d-none');
        alert("Geolocalização não é suportada por este navegador.");
        animarParaEAdicionarPino(coordIgrejaNazareth, "Localização atual");
    }
}

// Estado Global
let relatorios = [];
let favoritos = [];
let filtrosAtivos = new Set(['Trânsito', 'Evento', 'Incidente', 'Obras', 'Favorito']);
const camadaMarcadores = L.layerGroup().addTo(mapa);
let latLngCliqueAtual = null;

// Modais
const elementoModalRelatorio = document.getElementById('modalRelatorio');
const modalRelatorio = new bootstrap.Modal(elementoModalRelatorio);

// Obter emoji com base no tipo
const obterEmojiMarcador = (tipo) => {
    switch (tipo) {
        case 'Trânsito': return '🚗';
        case 'Evento': return '🎉';
        case 'Incidente': return '⚠️';
        case 'Obras': return '🚧';
        case 'Favorito': return '❤️';
        default: return '📍';
    }
};

const criarIconeMarcador = (tipo) => {
    const emoji = obterEmojiMarcador(tipo);
    return L.divIcon({
        html: `<div class="emoji-marker">${emoji}</div>`,
        className: 'custom-div-icon', // Remove leaflet default styling
        iconSize: [30, 30],
        iconAnchor: [15, 15],
        popupAnchor: [0, -15]
    });
};

// Renderizar marcadores no mapa
function renderizarMarcadores() {
    camadaMarcadores.clearLayers();

    relatorios.forEach(relatorio => {
        if (!filtrosAtivos.has(relatorio.tipo)) return;

        const marcador = L.marker([relatorio.lat, relatorio.lng], { icon: criarIconeMarcador(relatorio.tipo) });
        const imagemHtml = relatorio.imagem_base64
            ? `<div class="mt-2 text-center"><img src="${relatorio.imagem_base64}" alt="Foto do local" style="max-width: 100%; max-height: 150px; border-radius: 8px;"></div>`
            : '';

        const dataFormatada = typeof relatorio.timestamp === 'string'
            ? new Date(relatorio.timestamp.replace(' ', 'T') + 'Z').toLocaleString('pt-BR')
            : new Date(relatorio.timestamp).toLocaleString('pt-BR');

        const conteudoPopup = `
            <div style="min-width: 200px;">
                <h6 class="fw-bold fs-5 mb-1">${obterEmojiMarcador(relatorio.tipo)} ${relatorio.tipo}</h6>
                ${relatorio.endereco ? `<small class="text-secondary d-block lh-tight mb-2"><i class="fw-bold">📍 ${relatorio.endereco}</i></small>` : ''}
                ${imagemHtml}
                ${relatorio.descricao ? `<p class="mt-2 mb-1">${relatorio.descricao}</p>` : ''}
                <small class="text-muted d-block mt-2 text-saquanav">${dataFormatada}</small>
            </div>
        `;
        marcador.bindPopup(conteudoPopup);
        camadaMarcadores.addLayer(marcador);
    });

    // Adicionar marcadores de favoritos caso o filtro esteja ativo
    if (filtrosAtivos.has('Favorito')) {
        favoritos.forEach(fav => {
            const emojiUsado = fav.emoji || '❤️';
            const marcador = L.marker([fav.lat, fav.lng], {
                icon: L.divIcon({
                    html: `<div class="emoji-marker">${emojiUsado}</div>`,
                    className: 'custom-div-icon',
                    iconSize: [30, 30],
                    iconAnchor: [15, 15],
                    popupAnchor: [0, -15]
                })
            });

            const imagemHtmlFav = fav.imagem_base64
                ? `<div class="mt-2 text-center"><img src="${fav.imagem_base64}" alt="Foto do local" style="max-width: 100%; max-height: 150px; border-radius: 8px;"></div>`
                : '';

            const dataFavFormatada = typeof fav.timestamp === 'string'
                ? new Date(fav.timestamp.replace(' ', 'T') + 'Z').toLocaleString('pt-BR')
                : new Date(fav.timestamp).toLocaleString('pt-BR');

            const conteudoPopup = `
                <div style="min-width: 200px;">
                    <h6 class="fw-bold fs-5 mb-1">${emojiUsado} ${fav.nome}</h6>
                    ${fav.endereco ? `<small class="text-secondary d-block lh-tight mb-2"><i class="fw-bold">📍 ${fav.endereco}</i></small>` : ''}
                    ${imagemHtmlFav}
                    ${fav.descricao ? `<p class="mt-2 mb-1">${fav.descricao}</p>` : ''}
                    <small class="text-muted d-block mt-2 text-saquanav">${dataFavFormatada}</small>
                    <button class="btn btn-sm btn-outline-primary w-100 mt-2" onclick="abrirModalEdicaoFavorito(${fav.id})">✏️ Editar Favorito</button>
                </div>
            `;
            marcador.bindPopup(conteudoPopup);
            camadaMarcadores.addLayer(marcador);
        });
    }
}

// Renderizar favoritos no menu lateral e atualizar o mapa se necessário
function renderizarFavoritos() {
    const lista = document.getElementById('listaFavoritos');
    lista.innerHTML = '';

    favoritos.forEach(fav => {
        // Criar o item na lista do menu lateral
        const li = document.createElement('li');
        li.className = 'list-group-item d-flex justify-content-between align-items-center list-group-item-action fw-bold';
        li.style.cursor = 'pointer';
        li.innerHTML = `
            <div class="text-truncate" style="max-width: 70%;">
                ${fav.emoji || '❤️'} ${fav.nome}
            </div>
            <div class="d-flex align-items-center gap-2">
                <button class="btn btn-sm btn-outline-primary" title="Editar Favorito" onclick="event.stopPropagation(); window.abrirModalEdicaoFavorito(${fav.id});">✏️</button>
                <span class="badge bg-primary rounded-pill">Ir</span>
            </div>
        `;
        li.onclick = () => {
            mapa.flyTo([fav.lat, fav.lng], 16);
            bootstrap.Offcanvas.getInstance(document.getElementById('filtrosOffcanvas')).hide();
        };
        lista.appendChild(li);
    });

    renderizarMarcadores();
}


// Chamadas à API
async function buscarRelatorios() {
    try {
        const res = await fetch('/api/relatorios');
        if (!res.ok) throw new Error('A resposta da rede não foi bem-sucedida');
        relatorios = await res.json();
        renderizarMarcadores();
    } catch (err) {
        console.error('Falha ao buscar relatórios:', err);
    }
}

async function buscarFavoritos() {
    try {
        const res = await fetch('/api/favoritos');
        if (!res.ok) throw new Error('A resposta da rede não foi bem-sucedida');
        favoritos = await res.json();
        renderizarFavoritos();
    } catch (err) {
        console.error('Falha ao buscar favoritos:', err);
    }
}

async function enviarRelatorio(dadosRelatorio) {
    try {
        const res = await fetch('/api/relatorios', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosRelatorio)
        });
        if (!res.ok) throw new Error('Falha ao criar relatório');
        const novoRelatorio = await res.json();
        relatorios.unshift(novoRelatorio); // Adiciona ao início
        renderizarMarcadores();
    } catch (err) {
        console.error('Erro ao enviar relatório:', err);
        alert('Falha ao enviar relatório. Por favor, tente novamente.');
    }
}

async function enviarFavorito(dadosFavorito, editId = null) {
    try {
        const url = editId ? `/api/favoritos/${editId}` : '/api/favoritos';
        const method = editId ? 'PUT' : 'POST';

        const res = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(dadosFavorito)
        });
        if (!res.ok) throw new Error('Falha ao salvar favorito');
        const novoFavorito = await res.json();

        if (editId) {
            const index = favoritos.findIndex(f => f.id === parseInt(editId));
            if (index !== -1) favoritos[index] = novoFavorito;
        } else {
            favoritos.unshift(novoFavorito);
        }
        renderizarFavoritos();
    } catch (err) {
        console.error('Erro ao salvar favorito:', err);
        alert('Falha ao salvar favorito. A imagem pode ser muito grande, tente novamente com uma menor.');
    }
}

// Listeners de Eventos

// Listener para o input de imagem (Preview e conversão para Base64)
let base64ImagemAtual = null;
document.getElementById('imagemRelatorio').addEventListener('change', function (e) {
    const file = e.target.files[0];
    const previewContainer = document.getElementById('previewContainer');
    const previewImagem = document.getElementById('previewImagem');

    if (file) {
        const reader = new FileReader();
        reader.onload = function (evt) {
            base64ImagemAtual = evt.target.result;
            previewImagem.src = base64ImagemAtual;
            previewContainer.classList.remove('d-none');
        };
        reader.readAsDataURL(file);
    } else {
        base64ImagemAtual = null;
        previewContainer.classList.add('d-none');
        previewImagem.src = "";
    }
});

// Função de Geocodificação Reversa (OpenStreetMap / Nominatim)
async function buscarEndereco(lat, lng) {
    try {
        const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}&addressdetails=1`);
        const data = await res.json();

        if (data && data.address) {
            const end = data.address;
            const rua = end.road || end.pedestrian || end.path || end.footway || end.cycleway || "Rua Local";
            const numero = end.house_number ? `, ${end.house_number}` : ", S/N";
            const bairro = end.suburb || end.neighbourhood || end.quarter || end.city_district || "Saquarema";

            return `${rua}${numero} - ${bairro}`;
        }

        return data.display_name || 'Endereço não encontrado';
    } catch (err) {
        console.error('Erro de geocodificação:', err);
        return 'Falha ao buscar endereço. Você pode digitar manualmente.';
    }
}

// Função unificada para abrir o modal de novo pin
function abrirModalNovoPin(latlng) {
    latLngCliqueAtual = latlng;
    document.getElementById('relatorioLat').value = latlng.lat;
    document.getElementById('relatorioLng').value = latlng.lng;

    // Resetar formulário e UI para modo "Novo Pin"
    document.getElementById('formRelatorio').reset();
    document.getElementById('editFavoritoId').value = '';
    document.getElementById('modalRelatorioLabel').textContent = 'Novo Pin';
    document.getElementById('btnSalvarRelatorio').textContent = 'Criar Pin';
    document.getElementById('containerFavorito').classList.add('d-none');
    base64ImagemAtual = null;
    document.getElementById('previewContainer').classList.add('d-none');
    document.getElementById('previewImagem').src = "";

    // Iniciar busca de endereço
    const endInput = document.getElementById('enderecoRelatorio');
    endInput.value = "Buscando endereço detalhado da rua...";
    buscarEndereco(latlng.lat, latlng.lng).then(endereco => {
        endInput.value = endereco;
    });

    // Mostrar modal
    modalRelatorio.show();
}

// 1. Criar pin via duplo clique
mapa.on('dblclick', (e) => {
    abrirModalNovoPin(e.latlng);
});

// 2. Criar pin via "Segurar / Long Press" de 3,5 segundos
let pressTimer;
let latLngPressionado;

mapa.on('mousedown touchstart', (e) => {
    latLngPressionado = e.latlng;
    pressTimer = setTimeout(() => {
        abrirModalNovoPin(latLngPressionado);
    }, 2000); // 2,8 segundos
});

mapa.on('mouseup mouseleave touchend touchcancel', () => {
    clearTimeout(pressTimer);
});
mapa.on('mousemove touchmove', () => {
    // Se o usuário mover o dedo/mouse enquanto segura, cancelamos a ação (foi um drag no mapa)
    clearTimeout(pressTimer);
});

// Listener para expandir/recolher Detalhes do Favorito
document.getElementById('tipoRelatorio').addEventListener('change', (e) => {
    const container = document.getElementById('containerFavorito');
    if (e.target.value === 'Favorito') {
        container.classList.remove('d-none');
    } else {
        container.classList.add('d-none');
    }
});

// Lógica da janela de Edição de Favorito
window.abrirModalEdicaoFavorito = (id) => {
    const fav = favoritos.find(f => f.id === id);
    if (!fav) return;

    // Atualizar UI para "Edição"
    document.getElementById('modalRelatorioLabel').textContent = 'Editar Favorito';
    document.getElementById('btnSalvarRelatorio').textContent = 'Salvar Alterações';
    document.getElementById('editFavoritoId').value = fav.id;
    document.getElementById('relatorioLat').value = fav.lat;
    document.getElementById('relatorioLng').value = fav.lng;

    const selectTipo = document.getElementById('tipoRelatorio');
    selectTipo.value = 'Favorito';
    selectTipo.dispatchEvent(new Event('change')); // acionar evento para abrir gaveta

    // Preencher dados existentes
    document.getElementById('emojiFavorito').value = fav.emoji || '❤️';
    document.getElementById('tituloFavorito').value = fav.nome;
    document.getElementById('enderecoRelatorio').value = fav.endereco || '';
    document.getElementById('descRelatorio').value = fav.descricao || '';

    if (fav.imagem_base64) {
        base64ImagemAtual = fav.imagem_base64;
        const imgEl = document.getElementById('previewImagem');
        imgEl.src = base64ImagemAtual;
        document.getElementById('previewContainer').classList.remove('d-none');
    } else {
        base64ImagemAtual = null;
        document.getElementById('previewImagem').src = '';
        document.getElementById('previewContainer').classList.add('d-none');
    }

    modalRelatorio.show();
};

// Salvar Relatório ou Favorito
document.getElementById('btnSalvarRelatorio').addEventListener('click', () => {
    const tipo = document.getElementById('tipoRelatorio').value;
    const endereco = document.getElementById('enderecoRelatorio').value;
    const lat = document.getElementById('relatorioLat').value;
    const lng = document.getElementById('relatorioLng').value;
    const editFavoritoId = document.getElementById('editFavoritoId').value;

    if (!tipo) {
        alert('Por favor, selecione um tipo de marcação.');
        return;
    }

    if (tipo === 'Favorito') {
        const nome = document.getElementById('tituloFavorito').value || 'Local Salvo ' + new Date().toLocaleTimeString('pt-BR');
        const emoji = document.getElementById('emojiFavorito').value;
        const descricao = document.getElementById('descRelatorio').value;

        enviarFavorito({
            nome,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            emoji,
            endereco,
            imagem_base64: base64ImagemAtual,
            descricao
        }, editFavoritoId);
    } else {
        const descricao = document.getElementById('descRelatorio').value;
        enviarRelatorio({
            tipo,
            descricao,
            lat: parseFloat(lat),
            lng: parseFloat(lng),
            imagem_base64: base64ImagemAtual,
            endereco
        });
    }
    modalRelatorio.hide();
});

// Alternar Filtros
document.querySelectorAll('.filtro-checkbox').forEach(checkbox => {
    checkbox.addEventListener('change', (e) => {
        const tipo = e.target.value;
        if (e.target.checked) {
            filtrosAtivos.add(tipo);
        } else {
            filtrosAtivos.delete(tipo);
        }
        renderizarMarcadores();
    });
});

// Botão Minha Localização
document.getElementById('btnMinhaLocalizacao').addEventListener('click', (e) => {
    e.preventDefault(); // Evitar salto para o topo da página com href="#"
    centralizarNaMinhaLocalizacao();
});

// Botão Logo SaquaNav (Ir para a Igreja Padrão)
document.getElementById('btnIrParaIgreja').addEventListener('click', (e) => {
    e.preventDefault();
    mapa.flyTo(coordIgrejaNazareth, 15);
});

// Inicialização
document.querySelectorAll('.filtro-checkbox').forEach(checkbox => {
    checkbox.checked = true; // Forçar marcado (ignora cache do navegador)
    filtrosAtivos.add(checkbox.value);
});

buscarRelatorios();
buscarFavoritos();
