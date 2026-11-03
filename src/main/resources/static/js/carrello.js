/* ==========================================================================
   MotorShop - Logica Carrello (carrello.js)
   ========================================================================== */

// Array globale per memorizzare gli elementi del carrello in memoria
let articoliCarrello = [];

$(document).ready(function() {
    caricaCarrelloXML();

    // Evento sul pulsante di checkout
    $('#btnCheckout').on('click', function() {
        if (articoliCarrello.length === 0) {
            alert("Il carrello è vuoto!");
        } else {
            alert("Grazie per l'ordine! Questa è una simulazione didattica.");
        }
    });
});

/**
 * 1. Richiesta AJAX in jQuery per caricare carrello.xml (Requisito 4.2)
 */
function caricaCarrelloXML() {
    $.ajax({
        type: "GET",
        url: "xml/carrello.xml",
        dataType: "xml",
        success: function(xml) {
            articoliCarrello = [];

            // 2. Individua gli elementi <elemento> dell'XML ed estrae i dati
            $(xml).find('elemento').each(function() {
                const $el = $(this);
                articoliCarrello.push({
                    id: $el.find('idProdotto').text().trim(),
                    nome: $el.find('nome').text().trim(),
                    prezzoUnitario: parseFloat($el.find('prezzoUnitario').text().trim()) || 0,
                    quantita: parseInt($el.find('quantita').text().trim()) || 1,
                    immagine: $el.find('immagine').text().trim()
                });
            });

            // 3. Genera l'HTML e calcola i totali
            renderCarrello();
        },
        error: function(xhr, status, error) {
            console.error("Errore nel caricamento del file XML del carrello:", error);
            $('#cartContainer').html('<p style="color: #f87171;">Impossibile caricare i dati del carrello.</p>');
        }
    });
}

/**
 * Renderizza le schede prodotti nel DOM e aggiorna il riepilogo
 */
function renderCarrello() {
    const $container = $('#cartContainer');
    const $emptyCart = $('#emptyCart');

    $container.empty();

    if (articoliCarrello.length === 0) {
        $('.cart-layout').hide();
        $emptyCart.show();
        return;
    }

    $('.cart-layout').show();
    $emptyCart.hide();

    let totaleComplessivo = 0;
    let totaleQuantitaProdotti = 0;

    // Ciclo su ciascun articolo per la generazione dinamica (Requisito 4.2 - punto 3 e 4)
    articoliCarrello.forEach(function(item, index) {
        // Calcolo totale parziale del singolo elemento
        const totaleParziale = item.prezzoUnitario * item.quantita;
        totaleComplessivo += totaleParziale;
        totaleQuantitaProdotti += item.quantita;

        const cartHtml = `
            <article class="cart-product" data-id="${item.id}">
                <img src="${item.immagine}" alt="${item.nome}">
                <div class="cart-product-info">
                    <h3>${item.nome}</h3>
                    <p class="price-info">Prezzo unitario: €${item.prezzoUnitario.toFixed(2)}</p>
                    <p class="subtotal-info">Totale parziale: <strong id="subtotal-${index}">€${totaleParziale.toFixed(2)}</strong></p>
                </div>
                
                <!-- Controlli Modifica Quantità (Requisito 4.3) -->
                <div class="quantity">
                    <button type="button" class="btn btn-secondary" onclick="modificaQuantita(${index}, -1)">-</button>
                    <input type="number" id="qty-input-${index}" value="${item.quantita}" min="1" onchange="impostaQuantita(${index}, this.value)">
                    <button type="button" class="btn btn-secondary" onclick="modificaQuantita(${index}, 1)">+</button>
                </div>

                <!-- Pulsante Rimozione Prodotto (Requisito 4.4) -->
                <button type="button" class="btn" style="margin-left: 15px; background-color: #dc2626;" onclick="rimuoviProdotto(${index})">
                    Rimuovi
                </button>
            </article>
        `;

        $container.append(cartHtml);
    });

    // 5. Calcola e aggiorna il totale complessivo a schermo (Requisito 4.2 - punto 5)
    $('#summaryTotalCount').text(totaleQuantitaProdotti);
    $('#summaryGrandTotal').text("€" + totaleComplessivo.toFixed(2));
}

/**
 * Modifica la quantità tramite pulsanti + e - (Requisito 4.3)
 */
function modificaQuantita(index, variazione) {
    const nuovaQuantita = articoliCarrello[index].quantita + variazione;

    if (nuovaQuantita >= 1) {
        articoliCarrello[index].quantita = nuovaQuantita;
        alert("La quantità del prodotto '" + articoliCarrello[index].nome + "' è stata aggiornata a " + nuovaQuantita + ".");
        renderCarrello(); // Ricalcola i totali lato client
    }
}

/**
 * Imposta la quantità direttamente dal campo di input numerico (Requisito 4.3)
 */
function impostaQuantita(index, valore) {
    const nuovaQuantita = parseInt(valore);

    if (!isNaN(nuovaQuantita) && nuovaQuantita >= 1) {
        articoliCarrello[index].quantita = nuovaQuantita;
        alert("La quantità del prodotto '" + articoliCarrello[index].nome + "' è stata aggiornata a " + nuovaQuantita + ".");
        renderCarrello(); // Ricalcola i totali lato client
    } else {
        // Ripristina valore se non valido
        $(`#qty-input-${index}`).val(articoliCarrello[index].quantita);
    }
}

/**
 * Rimuove un prodotto dal carrello (Requisito 4.4)
 */
function rimuoviProdotto(index) {
    const nomeProdotto = articoliCarrello[index].nome;

    // Mostra l'alert obbligatorio come da specifica
    alert("Il prodotto '" + nomeProdotto + "' è stato rimosso dal carrello.");

    // Rimuove l'elemento dall'array in memoria
    articoliCarrello.splice(index, 1);//rimuove 1 solo elemento (non la quantita!!)

    // Ridisegna la pagina aggiornando immediatamente l'interfaccia e i totali
    renderCarrello();
}