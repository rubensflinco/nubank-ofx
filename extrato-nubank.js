$(function() {

  function startOfx() {
    return `
OFXHEADER:100
DATA:OFXSGML
VERSION:102
SECURITY:NONE
ENCODING:USASCII
CHARSET:1252
COMPRESSION:NONE
OLDFILEUID:NONE
NEWFILEUID:NONE

<OFX>
<BANKMSGSRSV1>
<STMTTRNRS>
<STMTRS>
<BANKTRANLIST>`;
  }

  function endOfx() {
    return `
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  }

  function bankStatement(date, amount, description) {
    return `
<STMTTRN>
<TRNTYPE>OTHER</TRNTYPE>
<DTPOSTED>${date}</DTPOSTED>
<TRNAMT>${amount}</TRNAMT>
<MEMO>${description}</MEMO>
</STMTTRN>`;
  }

  function normalizeAmount(text) {
    return text.replace('.', '').replace(',','.');
  }

  function normalizeDay(date) {
    return date.split(' ')[0]
  }

  function normalizeMonth(date) {
    var month = date.split(' ')[1]
    var months = {
      'Jan': '01',
      'Fev': '02',
      'Mar': '03',
      'Abr': '04',
      'Mai': '05',
      'Jun': '06',
      'Jul': '07',
      'Ago': '08',
      'Set': '09',
      'Out': '10',
      'Nov': '11',
      'Dez': '12'
    }
    return months[month];
  }

  function normalizeYear(date) {
    var dateArray = date.split(' ');
    if (dateArray.length > 2) {
      return '20'+dateArray[2];
    } else {
      return new Date().getFullYear();
    };
  }

  function normalizeDate(date) {
    return normalizeYear(date)+normalizeMonth(date)+normalizeDay(date);
  }

  function generateOfx() {
    var ofx = startOfx();

    $('.charge:visible').each(function(){
      var date = normalizeDate($(this).find('.time').text());
      var description = $(this).find('.description').text();
      var amount = normalizeAmount($(this).find('.amount').text());

      ofx += bankStatement(date, amount, description);
    });

    ofx += endOfx();

    var openMonth = " " + $($.find('md-tab.ng-scope.active .period')[0]).text().trim();
    var period = normalizeYear(openMonth) + "-" + normalizeMonth(openMonth);
    link = document.createElement("a");
    link.setAttribute("href", 'data:application/x-ofx,'+encodeURIComponent(ofx));
    link.setAttribute("download", "nubank-" + period + ".ofx");
    link.click();
  }

  const insertExportButtonCallback = function(mutationList, observer) {
    if(mutationList == undefined) return;

    if ($(".summary.open [role=\"gen-ofx\"]").length > 0) {
      return;
    }

    const targetElement = document.querySelector('.summary.open .nu-button');
    if (targetElement == undefined) {
      console.log('n achei o botao');
      return;
    }
    $('<button class="nu-button secondary" role="gen-ofx">Exportar para OFX</button>')
    .insertAfter('.summary.open .nu-button')
    .click(generateOfx);

    observer.disconnect();
  }

  const config = { attributes: true, childList: true, subtree: true }

  const observer = new MutationObserver(insertExportButtonCallback);
  observer.observe(document, config)
});

