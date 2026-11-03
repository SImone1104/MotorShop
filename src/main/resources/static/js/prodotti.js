/* ==========================================================================
   MotorShop / Paddock Store - Gestione Catalogo Prodotti (prodotti.js)
   A.A. 2026-27 - Progetto Front-End WSDA
   ========================================================================== */

// Array globale in memoria per mantenere i prodotti della categoria corrente
let prodottiAttuali = [];

// Esecuzione al caricamento completo del DOM
$(document).ready(function() {

    // 1. Caricamento iniziale della prima categoria (es. Caschi)
    const categoriaIniziale = $('#categoryFilter').val() || 'xml/caschi.xml';
    caricaProdottiXML(categoriaIniziale);

    // 2. Evento modifica della categoria dalla <select>
    $('#categoryFilter').on('change', function() {
        const fileXml = $(this).val();
        sincronizzaSidebar(fileXml);
        caricaProdottiXML(fileXml);
    });

    // 3. Evento click sui link della sidebar
    $('#sidebarCategories a').on('click', function(e) {
        e.preventDefault();
        const fileXml = $(this).data('xml');
        $('#categoryFilter').val(fileXml);
        sincronizzaSidebar(fileXml);
        caricaProdottiXML(fileXml);
    });

    // 4. Ricerca in tempo reale durante la digitazione
    $('#searchInput').on('keyup input', function() {
        aggiornaVistaProdotti();
    });

    // 5. Ordinamento prodotti
    $('#sortFilter').on('change', function() {
        aggiornaVistaProdotti();
    });

    // 6. Reset dei filtri
    $('#btnReset').on('click', function() {
        $('#searchInput').val('');
        $('#sortFilter').val('default');
        aggiornaVistaProdotti();
    });

    // 7. Eventi per la chiusura della Modale Dettagli
    $('#btnCloseModal').on('click', function() {
        chiudiModale();
    });

    $(window).on('click', function(event) {
        if ($(event.target).is('#infoModal')) {
            chiudiModale();
        }
    });

    $(document).on('keydown', function(event) {
        if (event.key === "Escape") {
            chiudiModale();
        }
    });
});

/**
 * Carica dinamicamente i prodotti tramite chiamata AJAX jQuery dal file XML indicato
 * @param {string} fileXml - Percorso del file XML da leggere
 */
function caricaProdottiXML(fileXml) {
    $.ajax({
        type: "GET",
        url: fileXml,
        dataType: "xml",
        success: function(xml) {
            prodottiAttuali = []; // Resetta l'array locale

            $(xml).find('prodotto').each(function() {
                const id = $(this).find('id').text().trim();
                const nome = $(this).find('nome').text().trim();
                const descrizione = $(this).find('descrizione').text().trim();
                const prezzo = parseFloat($(this).find('prezzo').text().trim()) || 0;
                const marca = $(this).find('marca').text().trim();
                const immagine = $(this).find('immagine').text().trim();
                const disponibilita = $(this).find('disponibilita').text().trim();

                prodottiAttuali.push({
                    id: id,
                    nome: nome,
                    descrizione: descrizione,
                    prezzo: prezzo,
                    marca: marca,
                    immagine: immagine,
                    disponibilita: disponibilita
                });
            });

            // Aggiorna la griglia applicando la ricerca e l'ordinamento correnti
            aggiornaVistaProdotti();
        },
        error: function(xhr, status, error) {
            console.error("Errore durante il caricamento del file XML:", fileXml, error);
            $('#products').html('<p style="color: #f87171; text-align: center;">Impossibile caricare i prodotti della categoria selezionata.</p>');
        }
    });
}

/**
 * Filtra e ordina i prodotti in memoria, quindi rigenera la griglia HTML
 */
function aggiornaVistaProdotti() {
    const parolaChiave = $('#searchInput').val().toLowerCase().trim();
    const criterioOrdinamento = $('#sortFilter').val();

    // 1. Filtraggio per Parola Chiave (Nome, Marca o Descrizione)
    let prodottiFiltrati = prodottiAttuali.filter(function(prodotto) {
        const inNome = prodotto.nome.toLowerCase().includes(parolaChiave);
        const inMarca = prodotto.marca.toLowerCase().includes(parolaChiave);
        const inDescrizione = prodotto.descrizione.toLowerCase().includes(parolaChiave);

        return inNome || inMarca || inDescrizione;
    });

    // 2. Ordinamento Lato Client
    if (criterioOrdinamento === 'price-asc') {
        prodottiFiltrati.sort((a, b) => a.prezzo - b.prezzo);
    } else if (criterioOrdinamento === 'price-desc') {
        prodottiFiltrati.sort((a, b) => b.prezzo - a.prezzo);
    } else if (criterioOrdinamento === 'name-asc') {
        prodottiFiltrati.sort((a, b) => a.nome.localeCompare(b.nome));
    } else if (criterioOrdinamento === 'name-desc') {
        prodottiFiltrati.sort((a, b) => b.nome.localeCompare(a.nome));
    }

    // 3. Rendering a schermo
    mostraProdotti(prodottiFiltrati);
}

/**
 * Genera l'HTML per le schede dei prodotti e lo inserisce nella pagina
 * @param {Array} lista - Array dei prodotti da visualizzare
 */
function mostraProdotti(lista) {
    const $container = $('#products');
    const $noResults = $('#noResults');

    $container.empty();

    if (lista.length === 0) {
        $noResults.show();
        return;
    }

    $noResults.hide();

    lista.forEach(function(prodotto) {
        const isDisponibile = prodotto.disponibilita.toLowerCase() === 'disponibile';
        const badgeClasse = isDisponibile ? 'disponibile' : 'esaurito';
        const bottoneCarrelloAttr = isDisponibile ? '' : 'disabled';
        const testoBottoneCarrello = isDisponibile ? 'Aggiungi al carrello' : 'Esaurito';

        const cardHtml = `
            <article class="product-card" data-id="${prodotto.id}">
                <img src="${prodotto.immagine}" alt="${prodotto.nome}" onclick="apriModaleDettagli('${prodotto.id}')" style="cursor: pointer;">
                <div class="product-info">
                    <p class="product-marca">${prodotto.marca}</p>
                    <h2 onclick="apriModaleDettagli('${prodotto.id}')" style="cursor: pointer;">${prodotto.nome}</h2>
                    <p class="product-desc-short">${prodotto.descrizione}</p>
                    <p class="price">€${prodotto.prezzo.toFixed(2)}</p>
                    <p><span class="badge-disponibilita ${badgeClasse}">${prodotto.disponibilita}</span></p>
                    <div class="product-buttons">
                        <button type="button" class="btn btn-secondary" onclick="apriModaleDettagli('${prodotto.id}')">Dettagli</button>
                        <button type="button" class="btn" onclick="aggiungiAlCarrello('${prodotto.id}', '${escapeHtml(prodotto.nome)}')" ${bottoneCarrelloAttr}>
                            ${testoBottoneCarrello}
                        </button>
                    </div>
                </div>
            </article>
        `;

        $container.append(cardHtml);
    });
}

/**
 * Apre la finestra modale popolando dinamicamente i dettagli del prodotto selezionato
 * @param {string} id - ID del prodotto
 */
function apriModaleDettagli(id) {
    const prodotto = prodottiAttuali.find(p => p.id.toString() === id.toString());
    if (!prodotto) return;

    const isDisponibile = prodotto.disponibilita.toLowerCase() === 'disponibile';

    $('#modalProductImage').attr('src', prodotto.immagine).attr('alt', prodotto.nome);
    $('#modalProductName').text(prodotto.nome);
    $('#modalProductBrand').text("Marca: " + prodotto.marca);
    $('#modalProductDescription').text(prodotto.descrizione);
    $('#modalProductPrice').text("€" + prodotto.prezzo.toFixed(2));

    $('#modalProductAvailability')
        .text("Stato: " + prodotto.disponibilita)
        .css('color', isDisponibile ? '#4ade80' : '#f87171');

    // Assegna la funzione di aggiunta al carrello al pulsante della modale
    const $btnModal = $('#modalAddToCartBtn');
    if (isDisponibile) {
        $btnModal.prop('disabled', false).text('Aggiungi al carrello');
        $btnModal.off('click').on('click', function() {
            aggiungiAlCarrello(prodotto.id, prodotto.nome);
            chiudiModale();
        });
    } else {
        $btnModal.prop('disabled', true).text('Esaurito');
    }

    $('#infoModal').fadeIn(200);
}

/**
 * Nasconde la finestra modale dei dettagli
 */
function chiudiModale() {
    $('#infoModal').fadeOut(150);
}

/**
 * Simula l'aggiunta al carrello mostrando l'alert() come richiesto al punto 3.8 dell'assignment
 * @param {string} id - ID del prodotto
 * @param {string} nome - Nome del prodotto
 */
function aggiungiAlCarrello(id, nome) {
    // Requisito Punto 3.8: Messaggio alert() con nome e id del prodotto selezionato
    alert("Prodotto aggiunto al carrello!\n\nID Prodotto: " + id + "\nNome: " + nome);
}

/**
 * Utility per evidenziare la categoria selezionata nella sidebar
 */
function sincronizzaSidebar(fileXml) {
    $('#sidebarCategories a').removeClass('active');
    $(`#sidebarCategories a[data-xml="${fileXml}"]`).addClass('active');
}

/**
 * Utility per evitare problemi con virgolette nei nomi dei prodotti negli attributi HTML
 */
function escapeHtml(text) {
    return text
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
}