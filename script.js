const form = document.getElementById("form");
const resultado = document.getElementById("resultado");

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const project = document.getElementById("project").value; 
  const cancerCID = document.getElementById("cancertype").value;
  const centerID = document.getElementById("center").value;
  const doadores = document.getElementById("doador").value.split("\n").map(v => v.trim()).filter(v => v);
  const amostras = document.getElementById("amostra").value.split("\n").map(v => v.trim()).filter(v => v);
  const sampleType = document.getElementById("sampletype").value;
  const sampleStatus = document.getElementById("samplestatus").value;
  const samplePreservation = document.getElementById("samplepreservation").value;
  const omicsType = document.getElementById("omicstype").value;

  const showError = (msg) => {
    resultado.innerHTML = `<p style="color:red;">${msg}</p>`;
  };

  if (!project) return showError("⚠️ Selecione um projeto."); 
  if (!cancerCID) return showError("⚠️ Selecione uma neoplasia primária.");
  if (!centerID) return showError("⚠️ Selecione o centro participante.");
  if (doadores.length === 0) return showError("⚠️ Informe pelo menos um código de participante.");
  if (amostras.length === 0) return showError("⚠️ Informe pelo menos um código de amostra.");
  if (doadores.length !== amostras.length) return showError("⚠️ Quantidade de participantes ≠ quantidade de amostras!");
  if (!sampleType) return showError("⚠️ Selecione o tipo de amostra.");
  if (!sampleStatus) return showError("⚠️ Selecione o status da amostra.");
  if (!samplePreservation) return showError("⚠️ Selecione a preservação da amostra.");
  if (!omicsType) return showError("⚠️ Selecione o tipo de ômica.");

  for (let i = 0; i < doadores.length; i++) {
    if (!/^\d{4}$/.test(doadores[i])) {
      return showError(`⚠️ Código de participante inválido na linha ${i + 1}: "${doadores[i]}" (use 4 dígitos).`);
    }
    if (!/^\d{4}$/.test(amostras[i])) {
      return showError(`⚠️ Código de amostra inválido na linha ${i + 1}: "${amostras[i]}" (use 4 dígitos).`);
    }
  }

  let codigosGerados = [];
  let linhasCSV = ["Projeto;CID;Centro;Participante;Amostra;Classificacao;Barcode"];

  for (let i = 0; i < doadores.length; i++) {
    const doadorID = doadores[i];
    const sampleID = amostras[i];
    const codExtra = `${sampleType}${sampleStatus}${samplePreservation}`;
    const barcode = `${project}-${cancerCID}-${centerID}-${doadorID}-${sampleID}-${codExtra}-${omicsType}`; 
    
    codigosGerados.push(barcode);
    linhasCSV.push(`${project};${cancerCID};${centerID};${doadorID};${sampleID};${codExtra};${omicsType};${barcode}`); 
  }

  resultado.innerHTML = `
    <h3>Barcodes gerados:</h3>
    <pre>${codigosGerados.join("\n")}</pre>
    <button id="downloadCsvBtn" class="btn">📥 Baixar CSV</button>
  `;

  document.getElementById("downloadCsvBtn").addEventListener("click", () => {
    const blob = new Blob([linhasCSV.join("\n")], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "barcodesgerados_ATPBR.csv";
    link.click();
  });
});
