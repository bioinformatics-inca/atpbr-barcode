const form = document.getElementById("form");
const resultado = document.getElementById("resultado");

const seqFieldset = document.getElementById("seq-fieldset");
const laneField = document.getElementById("lane-field");
const samplesLegend = document.getElementById("samples-legend");
const samplesHelp = document.getElementById("samples-help");
const samplesAccepted = document.getElementById("samples-accepted");

const getNivel = () => document.querySelector('input[name="barcodelevel"]:checked').value;

// Ajusta o formulário ao nível escolhido: no nível de amostra o barcode termina
// no 6º campo, então os campos de sequenciamento (ômica, corrida e lane) somem.
const atualizarNivel = () => {
  const nivelAmostra = getNivel() === "amostra";

  seqFieldset.classList.toggle("oculto", nivelAmostra);
  laneField.classList.toggle("oculto", nivelAmostra);

  samplesLegend.textContent = nivelAmostra
    ? "👤 Pacientes / Amostras"
    : "👤 Pacientes / Amostras / Lane";

  samplesHelp.textContent = nivelAmostra
    ? "Informe um valor por linha em cada campo. As duas colunas devem ter a mesma quantidade de linhas, pois cada linha corresponde a uma amostra."
    : "Informe um valor por linha em cada campo. As três colunas devem ter a mesma quantidade de linhas, pois cada linha corresponde a uma amostra.";

  samplesAccepted.textContent = nivelAmostra
    ? "Doadores/pacientes e amostras com 4 dígitos (0000 a 9999)."
    : "Doadores/pacientes e amostras com 4 dígitos (0000 a 9999) e lane com 2 dígitos (00 a 99).";

  resultado.innerHTML = "";
};

document.querySelectorAll('input[name="barcodelevel"]').forEach((radio) => {
  radio.addEventListener("change", atualizarNivel);
});

atualizarNivel();

form.addEventListener("submit", (e) => {
  e.preventDefault();

  const nivelAmostra = getNivel() === "amostra";

  const project = document.getElementById("project").value; 
  const cancerCID = document.getElementById("cancertype").value;
  const centerID = document.getElementById("center").value;
  const doadores = document.getElementById("doador").value.split("\n").map(v => v.trim()).filter(v => v);
  const amostras = document.getElementById("amostra").value.split("\n").map(v => v.trim()).filter(v => v);
  const lanes = document.getElementById("lane").value.split("\n").map(v => v.trim()).filter(v => v);
  const sampleType = document.getElementById("sampletype").value;
  const sampleStatus = document.getElementById("samplestatus").value;
  const samplePreservation = document.getElementById("samplepreservation").value;
  const collectionTubeAdditive = document.getElementById("collectiontubeadditive").value;
  const omicsType = document.getElementById("omicstype").value;
  const runNumber = document.getElementById("runnumber").value.trim();

  const showError = (msg) => {
    resultado.innerHTML = `<p style="color:red;">${msg}</p>`;
  };

  if (!project) return showError("⚠️ Selecione um projeto."); 
  if (!cancerCID) return showError("⚠️ Selecione uma neoplasia primária.");
  if (!centerID) return showError("⚠️ Selecione o centro participante.");
  if (doadores.length === 0) return showError("⚠️ Informe pelo menos um código de paciente (4 dígitos, ex.: 0001).");
  if (amostras.length === 0) return showError("⚠️ Informe pelo menos um código de amostra (4 dígitos, ex.: 1001).");
  if (!nivelAmostra && lanes.length === 0) return showError("⚠️ Informe pelo menos uma lane (2 dígitos, ex.: 01).");
  if (doadores.length !== amostras.length) return showError("⚠️ Quantidade de pacientes ≠ quantidade de amostras!");
  if (!nivelAmostra && doadores.length !== lanes.length) return showError("⚠️ Quantidade de lanes ≠ quantidade de pacientes/amostras!");
  if (!sampleType) return showError("⚠️ Selecione o tipo de amostra.");
  if (!sampleStatus) return showError("⚠️ Selecione o status da amostra.");
  if (!samplePreservation) return showError("⚠️ Selecione a preservação da amostra.");
  if (!nivelAmostra) {
    if (!omicsType) return showError("⚠️ Selecione o tipo de ômica.");
    if (!runNumber) return showError("⚠️ Informe o número da corrida.");
    if (!/^\d{2}$/.test(runNumber)) return showError("⚠️ Número da corrida inválido: \"" + runNumber + "\" (use 2 dígitos, de 00 a 99, ex.: 01).");
  }

  for (let i = 0; i < doadores.length; i++) {
    if (!/^\d{4}$/.test(doadores[i])) {
      return showError(`⚠️ Código de paciente inválido na linha ${i + 1}: "${doadores[i]}" (use 4 dígitos, de 0000 a 9999).`);
    }
    if (!/^\d{4}$/.test(amostras[i])) {
      return showError(`⚠️ Código de amostra inválido na linha ${i + 1}: "${amostras[i]}" (use 4 dígitos, de 0000 a 9999).`);
    }
    if (!nivelAmostra && !/^\d{2}$/.test(lanes[i])) {
      return showError(`⚠️ Lane inválida na linha ${i + 1}: "${lanes[i]}" (use 2 dígitos, de 00 a 99).`);
    }
  }

  let codigosGerados = [];
  let linhasCSV = [nivelAmostra
    ? "Projeto;CID;Centro;Participante;Amostra;Classificacao;AditivoTubo;Barcode"
    : "Projeto;CID;Centro;Participante;Amostra;Classificacao;AditivoTubo;Omica;Corrida;Lane;Barcode"];

  for (let i = 0; i < doadores.length; i++) {
    const doadorID = doadores[i];
    const sampleID = amostras[i];
    // O aditivo do tubo de coleta é apenas informativo: não compõe o barcode,
    // só é registrado como coluna extra no CSV.
    const codExtra = `${sampleType}${sampleStatus}${samplePreservation}`;
    const inicioBarcode = `${project}-${cancerCID}-${centerID}-${doadorID}-${sampleID}-${codExtra}`;
    const inicioCSV = `${project};${cancerCID};${centerID};${doadorID};${sampleID};${codExtra};${collectionTubeAdditive}`;

    if (nivelAmostra) {
      codigosGerados.push(inicioBarcode);
      linhasCSV.push(`${inicioCSV};${inicioBarcode}`);
    } else {
      const laneID = lanes[i];
      const codOmica = `${omicsType}${runNumber}${laneID}`;
      const barcode = `${inicioBarcode}-${codOmica}`;

      codigosGerados.push(barcode);
      linhasCSV.push(`${inicioCSV};${omicsType};${runNumber};${laneID};${barcode}`);
    }
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
    link.download = nivelAmostra
      ? "barcodesgerados_amostra_ATPBR.csv"
      : "barcodesgerados_omicas_ATPBR.csv";
    link.click();
  });
});
