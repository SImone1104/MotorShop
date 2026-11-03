/* ==========================================================================
   MotorShop / Paddock Store - Gestione Catalogo Prodotti (prodotti.js)
   A.A. 2026-27 - Progetto Front-End WSDA
   ========================================================================== */

// Array globale in memoria per mantenere i prodotti della categoria corrente
let prodottiAttuali = [];

// Esecuzione al caricamento completo del DOM
$(document).ready(function() { //garantisce che il codice venga eseguito solo dopo che la pagina sia stata caricata

    // 1. Caricamento iniziale della prima categoria (es. Caschi)
    const categoriaIniziale = $('#categoryFilter').val() || 'xml/caschi.xml'; //Legge il valore iniziale del menu a tendina e avvia la prima chiamata AJAX.
    caricaProdottiXML(categoriaIniziale);

    // 2. Evento modifica della categoria dalla <select>
    $('#categoryFilter').on('change', function() { //<3.2 ass1 start>
        const fileXml = $(this).val();
        sincronizzaSidebar(fileXml);
        caricaProdottiXML(fileXml);
    });

    // 3. Evento click sui link della sidebar
    $('#sidebarCategories a').on('click', function(e) {
        e.preventDefault(); //per evitare che la pagina si ricarichi
        const fileXml = $(this).data('xml'); //legge il valore dell'attributo personalizzato
        $('#categoryFilter').val(fileXml); //nel tendina inserisce il nuovo valore
        sincronizzaSidebar(fileXml);
        caricaProdottiXML(fileXml);
    });

    // 4. Ricerca in tempo reale durante la digitazione
    $('#searchInput').on('keyup input', function() {
        aggiornaVistaProdotti();//Ad ogni carattere digitato o cancellato invoco
    });

    // 5. Ordinamento prodotti
    $('#sortFilter').on('change', function() {
        aggiornaVistaProdotti(); //analogamente si ascolta sul cambiamento del menu di ordinamento
    });

    // 6. Reset dei filtri
    $('#btnReset').on('click', function() {
        $('#searchInput').val(''); //rimuove testo dalla navbar
        $('#sortFilter').val('default'); //imposta i filtri a def quando abbiamo un reset
        aggiornaVistaProdotti();
    });

    // 7. Eventi per la chiusura della Modale Dettagli come da 3.7 dell assegnamento1
    $('#btnCloseModal').on('click', function() {
        chiudiModale();
    });

    $(window).on('click', function(event) {
        if ($(event.target).is('#infoModal')) { //event.target e l'elemento esatto dove ce al click il puntatore del mouse
            chiudiModale(); //controlla che il bersaglio sia infoModal che sta all esterno del suo contenuto
        }
    });

    $(document).on('keydown', function(event) {
        if (event.key === "Escape") { //premendo esc mettendosi in ascolto con qualsiasi eventon della tastiera
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
        dataType: "xml", //interpreta il testo direttamente come xml
        success: function(xml) { //funzione che scatta solo col successo 200ok
            prodottiAttuali = []; // Resetta l'array locale per cancellare i prodotti della categ precedente

            $(xml).find('prodotto').each(function() { //cicla su ciascun nodo prodotto
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
    const parolaChiave = $('#searchInput').val().toLowerCase().trim(); //input della barra di ricerca reso case insesitive
    const criterioOrdinamento = $('#sortFilter').val();//recupera il valore del menu a tendina per lordine

    // 1. Filtraggio per Parola Chiave (Nome, Marca o Descrizione)
    let prodottiFiltrati = prodottiAttuali.filter(function(prodotto) {
        const inNome = prodotto.nome.toLowerCase().includes(parolaChiave);
        const inMarca = prodotto.marca.toLowerCase().includes(parolaChiave);
        const inDescrizione = prodotto.descrizione.toLowerCase().includes(parolaChiave);

        return inNome || inMarca || inDescrizione;//va a prnedere dall array il prodotto/i che corrispondono per nome, marca o descrizione alla parola della barra
        //restituendo true o false per ciascun elemento dell array
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
    const $container = $('#products'); //seleziona la griglia html dove vengono inseriti i prodotti
    const $noResults = $('#noResults'); //il blocco html per mostrare il mex nessun prodotto

    $container.empty(); //svuota l html

    if (lista.length === 0) {
        $noResults.show(); //gestione del caso nessun risultato
        return;
    }

    $noResults.hide();//se ci sono prodotti lo nasconde

    lista.forEach(function(prodotto) {
        const isDisponibile = prodotto.disponibilita.toLowerCase() === 'disponibile';
        const badgeClasse = isDisponibile ? 'disponibile' : 'esaurito'; //serve per la classe css verde o rosso
        const bottoneCarrelloAttr = isDisponibile ? '' : 'disabled'; //serve ad avere la vairabile vuota o disabled se non ce disponibilita
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

        $container.append(cardHtml);//Inserimento nel DOM-- ogni html di prodotto viene iniettato nel contenitore
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
        .css('color', isDisponibile ? '#4ade80' : '#f87171');//verde o rosso

    // Assegna la funzione di aggiunta al carrello al pulsante della modale
    const $btnModal = $('#modalAddToCartBtn');
    if (isDisponibile) {
        $btnModal.prop('disabled', false).text('Aggiungi al carrello');
        $btnModal.off('click').on('click', function() { //per rimuovere eventuali vecchi listener agganciati ai prodotti aperti in precedenza.
            aggiungiAlCarrello(prodotto.id, prodotto.nome);
            chiudiModale();
        });
    } else {
        $btnModal.prop('disabled', true).text('Esaurito');
    }

    $('#infoModal').fadeIn(200); //transazione graduale e non instantanea che avrei con show() e hide()
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
    $('#sidebarCategories a').removeClass('active');//rimuovo la classe CSS active da tutti i link della sidebar per resettare lo stato precedente.
    $(`#sidebarCategories a[data-xml="${fileXml}"]`).addClass('active');//individuo il link che corrisponde al percorso XML della categoria corrente e gli applico la classe
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