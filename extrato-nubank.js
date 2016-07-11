
$(function() {

  function startOfx(from, to) {
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
  <SIGNONMSGSRSV1>
      <SONRS>
          <STATUS>
              <CODE>0
              <SEVERITY>INFO
          </STATUS>
          <LANGUAGE>ENG
          <FI>
              <ORG>NUBANK
              <FID>NUBANK
          </FI>
      </SONRS>
  </SIGNONMSGSRSV1>
  <BANKMSGSRSV1>
    <STMTTRNRS>
      <STMTRS>
        <BANKACCTFROM>
            <BANKID>NUBANK</BANKID>
            <ACCTID>0</ACCTID>
            <ACCTTYPE>LINEOFCREDIT</ACCTTYPE>
        </BANKACCTFROM>
        <BANKTRANLIST>
          <DTSTART>${from}</DTSTART>
          <DTEND>${to}</DTEND>`;
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
      <TRNAMT>${amount * -1}</TRNAMT>
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
    var ofx = startOfx(normalizeDate($($.find('.period>span')[0]).text()), normalizeDate($($.find('.period>span')[1]).text()));

    $('.charge:visible').each(function(){
      var date = normalizeDate($(this).find('.time').text());
      var description = $(this).find('.description').text();
      var amount = normalizeAmount($(this).find('.amount').text());

      ofx += bankStatement(date, amount, description);
    });

    ofx += endOfx();

    link = document.createElement("a");
    link.setAttribute("href", 'data:application/x-ofx,'+encodeURIComponent(ofx));
    link.setAttribute("download", "fatura-nubank.ofx");
    link.click();      
  }

  $(document).on('DOMNodeInserted', '.summary .nu-button:contains(Gerar boleto)', function () {
    $('<button class="nu-button secondary" role="gen-ofx">Exportar OFX</button>')
    .insertAfter('.summary .nu-button')
    .click(generateOfx);
  });
});
