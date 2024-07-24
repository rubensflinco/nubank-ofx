(function () {
  const selectorCss = {
    extensionActiveInPage: '.extension-nubank-ofx-meu-dinheiro-web',
    titlePage: '[data-area="main-header"] .chakra-text',
    headerBtns: '[data-area="main-body"] div>div:nth-child(2)>div:last-child>div:last-child>div',
    openMonth: '[data-area="main-body"] > div > div > div > div > div > button:nth-child(3) > span',
    invoiceItem: '[data-area="main-body"] > div > div> table > tbody tr[tabindex="0"]',
    invoice: {
      description: 'td:nth-child(4) p',
      date: 'td:nth-child(1) p',
      amount: 'td:nth-child(5) p'
    }
  }

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
    let amount = (text.replace('R$', '').replace('.', '').replace(',', '.')).trim();
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
    const month = String(date.split(' ')[1]).toLocaleLowerCase()
    const months = {
      'jan': '01',
      'janeiro': '01',
      'fev': '02',
      'fevereiro': '02',
      'mar': '03',
      'março': '03',
      'abr': '04',
      'abril': '04',
      'mai': '05',
      'maio': '05',
      'jun': '06',
      'junho': '06',
      'jul': '07',
      'julho': '07',
      'ago': '08',
      'agosto': '08',
      'set': '09',
      'setembro': '09',
      'out': '10',
      'outubro': '10',
      'nov': '11',
      'novembro': '11',
      'dez': '12',
      'dezembro': '12'
    }

    return months[month];
  }

  const normalizeYear = (date, ifJan = true) => {
    const openMonth = (document.querySelector(selectorCss.openMonth).textContent.trim()).toLocaleLowerCase();
    const dateArray = String(date).split(' ');
    if (dateArray.length > 2) {
      return dateArray[2];
    } else {
      if ((ifJan) && (openMonth.includes("janeiro"))) {
        return Number(new Date().getFullYear()) - 1;
      } else {
        return new Date().getFullYear();
      }
    };
  }

  const normalizeDate = (date, dataCompra = false) => {
    date = preNormalizeDate(date);
    const [year, month, day] = [
      normalizeYear(date),
      normalizeMonth(date),
      normalizeDay(date)
    ];
    if (dataCompra === false) {
      const newDate = new Date(`${year}-${month}-${day}`);
      newDate.setDate(newDate.getDate() + 1);

      const normalizedDate = newDate.toISOString().slice(0, 10).replace(/-/g, '');
      return normalizedDate;
    } else {
      const dataFatura = `${year}${month}${day}`;
      return dataFatura;
    }
  };

  const preNormalizeDate = (date) => {
    date = String(date).toLocaleLowerCase();
    const today = new Date(); // Get the current date and time
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1); // Subtract one day
    
    const options = {
      'hoje': `${today.getDate()} ${today.toLocaleString('pt-BR', { month: 'long' })}`,
      'ontem': `${yesterday.getDate()} ${yesterday.toLocaleString('pt-BR', { month: 'long' })}`,
      'segunda': `${obterDataSemanaAtual('segunda')}`,
      'terça': `${obterDataSemanaAtual('terça')}`,
      'quarta': `${obterDataSemanaAtual('quarta')}`,
      'quinta': `${obterDataSemanaAtual('quinta')}`,
      'sexta': `${obterDataSemanaAtual('sexta')}`,
      'sábado': `${obterDataSemanaAtual('sábado')}`,
      'domingo': `${obterDataSemanaAtual('domingo')}`
    }

    const result = options[date];
    if(result){
      return result;
    }else{
      return date;
    }
  }

  function obterDataSemanaAtual(nomeDiaDaSemana = null) {
    nomeDiaDaSemana = String(nomeDiaDaSemana).toLocaleLowerCase();
    const diasSemana = {
        'domingo': 0,
        'segunda': 1,
        'terça': 2,
        'quarta': 3,
        'quinta': 4,
        'sexta': 5,
        'sábado': 6
    };

    const hoje = new Date();
    const diaAtual = hoje.getDay(); // 0 (domingo) a 6 (sábado)

    const datasSemana = {};

    for (const [diaNome, diaIndice] of Object.entries(diasSemana)) {
        const diferencaDias = diaIndice - diaAtual;
        const data = new Date(hoje);
        data.setDate(hoje.getDate() + diferencaDias);
        datasSemana[diaNome] = `${data.getDate()} ${data.toLocaleString('pt-BR', { month: 'long' })}`;
    }

    if(nomeDiaDaSemana == null){
        return datasSemana;
    }else{
        return datasSemana[nomeDiaDaSemana];
    }
}

  const exportOfx = (ofx, appendNameFile) => {
    const openMonth = " " + document.querySelector(selectorCss.openMonth).textContent.trim().toLocaleLowerCase();
    const period = normalizeYear(openMonth, false) + "-" + normalizeMonth(openMonth);
    link = document.createElement("a");
    link.setAttribute("href", 'data:application/x-ofx,' + encodeURIComponent(ofx));
    link.setAttribute("download", `nubank-${appendNameFile}-${period}-${openMonth}.ofx`);
    link.click();
  }

  const generateOfx = (dataCompra = false) => {
    let ofx = startOfx();
    let saveDate = "";

    const invoiceItems = document.querySelectorAll(selectorCss.invoiceItem);
    invoiceItems.forEach(function (charge) {
      if (charge.getAttribute('tabindex') == '0') {
        const description = charge.querySelector(selectorCss.invoice.description).textContent.trim();
        let dateCurent = charge.querySelector(selectorCss.invoice.date)?.textContent;
        if((dateCurent == "") || (dateCurent == null) || (dateCurent == undefined)){
          dateCurent = saveDate;
        }else{
          saveDate = dateCurent;
        }
        const date = normalizeDate(dateCurent, dataCompra);
        const amount = normalizeAmount(charge.querySelector(selectorCss.invoice.amount).textContent);

        ofx += bankStatement(date, amount, description);
      }
    });

    ofx += endOfx();
    if (dataCompra === true) {
      exportOfx(ofx, "data-compra");
    } else {
      exportOfx(ofx, "data-fatura");
    }
  }

  const createExportButtonNew = () => {
    const div = document.createElement('div');
    div.classList.add('extension-nubank-ofx-meu-dinheiro-web');

    const btn1 = document.createElement('button');
    btn1.classList.add('css-nde0hv');
    btn1.setAttribute('role', 'gen-ofx');
    btn1.textContent = "Exportar para OFX (Data da fatura)";
    btn1.addEventListener('click', () => { generateOfx(false) });

    const btn2 = document.createElement('button');
    btn2.classList.add('css-nde0hv');
    btn2.setAttribute('role', 'gen-ofx-2');
    btn2.textContent = "Exportar para OFX (Data da compra)";
    btn2.addEventListener('click', () => { generateOfx(true) });

    div.appendChild(btn1);
    div.appendChild(document.createElement('br'));
    div.appendChild(btn2);

    return div;
  }

  const insertExportButtonCallback = (mutationList, observer) => {
    const extensionActiveInPage = document.querySelectorAll(selectorCss.extensionActiveInPage);
    const titlePage = document.querySelectorAll(selectorCss.titlePage)?.[0]?.textContent;
    const headerBtns = document.querySelectorAll(selectorCss.headerBtns);

    if (mutationList === null || mutationList === undefined || (mutationList?.length <= 0)) {
      return;
    };

    if (extensionActiveInPage === null || extensionActiveInPage === undefined || (extensionActiveInPage?.length > 0)) {
      return;
    };

    if (titlePage === null || titlePage === undefined || (titlePage !== "Resumo de faturas")) {
      return;
    };

    if (headerBtns?.length > 0) {
      for (let i = 0; i < headerBtns.length; i++) {
        const exportOfxButton = createExportButtonNew();
        headerBtns[i].parentNode.appendChild(exportOfxButton);
      }
    }

  }

  const observer = new MutationObserver(insertExportButtonCallback);
  observer.observe(document, { attributes: true, childList: true, subtree: true });
})();
