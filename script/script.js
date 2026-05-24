//////////////////////////////////////////////////////////////////////////////////////////////
//SELEÇÂO DE MAPAS

const iconeMapasExpandr = document.getElementById('icone-mapas-expandir');
const listaMapas = document.getElementById('libraryList');
const mapaControleInput = document.getElementById('input-mapas-controle');
const mapasControle = document.getElementById('mapas-controle');
const mapaControleButton = document.getElementById('mapas-controle-button');
const somsControle = document.getElementById('sons-controle');


//Funçaõ para mostrar ou ocultar o controle de mapas, que é onde ficam os botões de mostrar mapa para os jogadores e remover mapa do jogo
const mapaIcone = document.getElementById('mapas-icone');

mapaIcone.addEventListener('click', () => {
    if (mapasControle.style.display === 'none' || mapasControle.style.display === '') {
        mapasControle.style.display = 'block';
        listaMapas.style.display = 'none';
        mapaControleInput.style.display = 'none';
        mapaControleButton.style.display = 'none';
        mapasControle.style.height = '20px';
    } else {
        mapasControle.style.display = 'none';
    }
});

//Função para expandir ou recolher a lista de mapas disponíveis na biblioteca
iconeMapasExpandr.addEventListener('click', () => {

    if (listaMapas.style.display === 'none') {
        listaMapas.style.display = 'flex';
        mapaControleButton.style.display = 'flex';
        mapaControleInput.style.display = 'flex';
        mapasControle.style.height = '355px';
        iconeMapasExpandr.style.transform = 'rotate(0deg)';
        if (somsControle.style.display === 'none') {
            // Deixa o controle de sons no mesmo nível do controle de mapas, caso ele esteja aberto
        } else {
            somsControle.style.top = '395px';
        }
    } else {
        listaMapas.style.display = 'none';
        mapaControleInput.style.display = 'none';
        mapaControleButton.style.display = 'none';
        mapasControle.style.height = '20px';
        iconeMapasExpandr.style.transform = 'rotate(-90deg)';
        if (somsControle.style.display === 'none') {
            // Deixa o controle de sons no mesmo nível do controle de mapas, caso ele esteja aberto
        } else {
            somsControle.style.top = '65px';
        }
    }
    console.log('Clicou no ícone de expandir mapas');
});

//////////////////////////////////////////////////////////////////////////////////////////////

//Função para mostrar ou ocultar o controle de sons, que é onde ficam os botões de tocar, pausar e parar os sons ambientes