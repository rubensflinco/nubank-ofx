(function () {

  const startOfx = () => {
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

  const endOfx = () =>
    `
</BANKTRANLIST>
</STMTRS>
</STMTTRNRS>
</BANKMSGSRSV1>
</OFX>`;

  const bankStatement = (date, amount, description) =>
    `
<STMTTRN>
<TRNTYPE>OTHER</TRNTYPE>
<DTPOSTED>${date}</DTPOSTED>
<TRNAMT>${amount}</TRNAMT>
<MEMO>${description}</MEMO>
</STMTTRN>`;

  const normalizeAmount = (text) => {
    let amount = text.replace('.', '').replace(',', '.');
    if (String(amount).includes("-")) {
      amount = amount.replace('-', '+');
    } else {
      amount = "-" + amount;
    }
    return amount;
  }

  const normalizeDay = (date) =>
    date.split(' ')[0];

  const normalizeMonth = (date) => {
    const month = date.split(' ')[1]
    const months = {
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

  const normalizeYear = (date, ifJan = true) => {
    const openMonth = (document.querySelector('md-tab.ng-scope.active .period').textContent.trim()).toLocaleUpperCase();
    const dateArray = date.split(' ');
    if (dateArray.length > 2) {
      return '20' + dateArray[2];
    } else {
      if((ifJan) && (openMonth.includes("JAN"))){
        return Number(new Date().getFullYear())-1;
      }else{
        return new Date().getFullYear();
      }
    };
  }

  const normalizeDate = (date, dataCompra = false) => {
    const [year, month, day] = [
      normalizeYear(date),
      normalizeMonth(date),
      normalizeDay(date)
    ];
    if (dataCompra === false) {
      const dataFatura = `${year}${month}${day}`;
      return dataFatura;
    } else {
      const newDate = new Date(`${year}-${month}-${day}`);
      newDate.setDate(newDate.getDate() - 1);

      const normalizedDate = newDate.toISOString().slice(0, 10).replace(/-/g, '');
      return normalizedDate;
    }
  };

  const exportOfx = (ofx, appendNameFile) => {
    const openMonth = " " + document.querySelector('md-tab.ng-scope.active .period').textContent.trim();
    const period = normalizeYear(openMonth, false) + "-" + normalizeMonth(openMonth);
    link = document.createElement("a");
    link.setAttribute("href", 'data:application/x-ofx,' + encodeURIComponent(ofx));
    link.setAttribute("download", `nubank-${appendNameFile}-${period}.ofx`);
    link.click();
  }

  const generateOfx = () => {
    let ofx = startOfx();

    document.querySelectorAll('.md-tab-content:not(.ng-hide) .charge:not([style=\'display:none\'])').forEach(function (charge) {
      const description = charge.querySelector('.description').textContent.trim();
      const date = normalizeDate(charge.querySelector('.time').textContent, false);
      const amount = normalizeAmount(charge.querySelector('.amount').textContent);

      ofx += bankStatement(date, amount, description);
    });

    ofx += endOfx();
    exportOfx(ofx, "data-fatura");
  }


  const generateOfxDataCompra = () => {
    let ofx = startOfx();

    document.querySelectorAll('.md-tab-content:not(.ng-hide) .charge:not([style=\'display:none\'])').forEach(function (charge) {
      const description = charge.querySelector('.description').textContent.trim();
      const date = normalizeDate(charge.querySelector('.time').textContent, true);
      const amount = normalizeAmount(charge.querySelector('.amount').textContent);

      ofx += bankStatement(date, amount, description);
    });

    ofx += endOfx();
    exportOfx(ofx, "data-compra");
  }

  const createExportButtonNew = () => {
    const div = document.createElement('div');
    div.classList.add('extension-nubank-ofx-meu-dinheiro-web');

    const btn1 = document.createElement('button');
    btn1.classList.add('nu-button');
    btn1.classList.add('secondary');
    btn1.setAttribute('role', 'gen-ofx');
    btn1.textContent = "Exportar para OFX (Data da fatura)";
    btn1.addEventListener('click', generateOfx);

    const btn2 = document.createElement('button');
    btn2.classList.add('nu-button');
    btn2.classList.add('secondary');
    btn2.setAttribute('role', 'gen-ofx-2');
    btn2.textContent = "Exportar para OFX (Data da compra)";
    btn2.addEventListener('click', generateOfxDataCompra);

    div.appendChild(btn1);
    div.appendChild(btn2);

    return div;
  }

  const insertExportButtonCallback = (mutationList, observer) => {
    if (mutationList === null || (mutationList?.length <= 0)) {
      return;
    };

    const billsBrowser = document.querySelector('.bills-browser');
    if (billsBrowser === null || (billsBrowser?.length <= 0)) {
      return;
    };

    const nuPageBtns = document.querySelectorAll('.bills-browser .summary .nu-button');
    if (nuPageBtns?.length > 0) {
      for (let i = 0; i < nuPageBtns.length; i++) {
        const exportOfxButton = createExportButtonNew();
        nuPageBtns[i].parentNode.appendChild(exportOfxButton);
      }
    }

    const extensionActive = document.querySelectorAll('.extension-nubank-ofx-meu-dinheiro-web');
    if (extensionActive?.length > 0) {
      observer.disconnect()
      return;
    }

  }

  const observer = new MutationObserver(insertExportButtonCallback);
  observer.observe(document, { attributes: true, childList: true, subtree: true });
})();
