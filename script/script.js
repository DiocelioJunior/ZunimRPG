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
        if (somsControle.style.display === 'none' || somsControle.style.display === '') {
            mapasControle.style.display = 'block';
            listaMapas.style.display = 'none';
            mapaControleInput.style.display = 'none';
            mapaControleButton.style.display = 'none';
            mapasControle.style.height = '20px';
        } else {
            if (somsControle.style.top === '10px') {
                if (somsControle.style.height === '20px') {
                    mapasControle.style.display = 'block';
                    listaMapas.style.display = 'none';
                    mapaControleInput.style.display = 'none';
                    mapaControleButton.style.display = 'none';
                    mapasControle.style.height = '20px';
                    mapasControle.style.top = '65px';
                } else {
                                        mapasControle.style.display = 'block';
                    listaMapas.style.display = 'none';
                    mapaControleInput.style.display = 'none';
                    mapaControleButton.style.display = 'none';
                    mapasControle.style.height = '20px';
                    mapasControle.style.top = '435px';
                }
            }
        }
    } else {
        mapasControle.style.display = 'none';
        somsControle.style.top = '10px';
    }
});

//Função para expandir ou recolher a lista de mapas disponíveis na biblioteca
iconeMapasExpandr.addEventListener('click', () => {

    if (getComputedStyle(listaMapas).display === 'none') {

        listaMapas.style.display = 'flex';
        mapaControleButton.style.display = 'flex';
        mapaControleInput.style.display = 'flex';
        mapasControle.style.height = '355px';
        iconeMapasExpandr.style.transform = 'rotate(0deg)';

        if (getComputedStyle(somsControle).display === 'none') {
            // Controle de sons fechado
        } else {
            if (getComputedStyle(somsControle).top === '10px') {
                //
            } else {
                somsControle.style.top = '395px';
            }
        }
    } else {
        listaMapas.style.display = 'none';
        mapaControleInput.style.display = 'none';
        mapaControleButton.style.display = 'none';
        mapasControle.style.height = '20px';
        iconeMapasExpandr.style.transform = 'rotate(-90deg)';

        if (getComputedStyle(somsControle).display === 'none') {
            // Controle de sons fechado
        } else {
            if (getComputedStyle(mapasControle).top === '10px') {
                somsControle.style.top = '65px';
            } else {
                somsControle.style.top = '395px';
            }
        }
    }
});

//////////////////////////////////////////////////////////////////////////////////////////////

//Função para mostrar ou ocultar o controle de sons, que é onde ficam os botões de tocar, pausar e parar os sons ambientes

const sonsIcone = document.getElementById('sons-ambiente-icone');
const listaSons = document.getElementById('soundList');
const iconeSonsExpandir = document.getElementById('icone-sons-expandir');

//Função para mostrar ou ocultar o controle de sons, que é onde ficam os botões de tocar, pausar e parar os sons ambientes
sonsIcone.addEventListener("click", () => {

    if (somsControle.style.display === "none") {
        if (mapasControle.style.display === 'none' || mapasControle.style.display === '') {
            somsControle.style.top = '10px';
            somsControle.style.height = '20px';
            listaSons.style.display = 'none';
        } else {
            if (listaMapas.style.display === 'none') {
                somsControle.style.top = '65px';
                somsControle.style.height = '20px';
                listaSons.style.display = 'none';
            } else {
                somsControle.style.top = '395px';
                somsControle.style.height = '20px';
                listaSons.style.display = 'none';
            }
        }
        somsControle.style.display = 'flex'
    } else {
        somsControle.style.display = 'none'
        mapasControle.style.top = '10px';
    }
});

//Função para expandir ou recolher a lista de sons disponíveis na biblioteca
iconeSonsExpandir.addEventListener('click', () => {
    if (listaSons.style.display === 'none') {
        listaSons.style.display = 'flex';
        iconeSonsExpandir.style.transform = 'rotate(0deg)';
        somsControle.style.height = '395px';
        if (getComputedStyle(mapasControle).display === 'none') {
            // Controle de mapas fechado
        } else {
            if (getComputedStyle(mapasControle).top === '10px') {
                //
            } else {
                mapasControle.style.top = '435px';
            }
        }
    } else {
        listaSons.style.display = 'none';
        somsControle.style.height = '20px';
        iconeSonsExpandir.style.transform = 'rotate(-90deg)';
        if (getComputedStyle(mapasControle).display === 'none') {
            // Controle de mapas fechado
        } else {
            if (getComputedStyle(mapasControle).top === '10px') {
                //
            } else {
                mapasControle.style.top = '65px';
            }
        }

    }
});