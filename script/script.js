const iconeMapasExpandr = document.getElementById('icone-mapas-expandir');

iconeMapasExpandr.addEventListener('click', () => {

    const listaMapas = document.getElementById('libraryList');
    const mapaControleInput = document.getElementById('input-mapas-controle');
    const mapasControle = document.getElementById('mapas-controle');
        if (listaMapas.style.display === 'none') {
            listaMapas.style.display = 'flex';
            mapaControleInput.style.display = 'flex';
            mapasControle.style.height = '420px';
            iconeMapasExpandr.style.transform = 'rotate(0deg)';
        } else {
            listaMapas.style.display = 'none';
            mapaControleInput.style.display = 'none';
            mapasControle.style.height = '20px';
            iconeMapasExpandr.style.transform = 'rotate(-90deg)';
        }
    console.log('Clicou no ícone de expandir mapas');
});