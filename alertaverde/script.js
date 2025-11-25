// Inicialização do Mapa
const map = L.map("map", {
  zoomControl: false, // Vamos reposicionar ou remover para mobile
}).setView([-15.79, -47.88], 4);

// Adicionar camada de tiles (OpenStreetMap)
L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
  attribution:
    '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
}).addTo(map);

// Ícones Personalizados
const fireIcon = L.divIcon({
  html: '<i class="fa-solid fa-fire" style="color: #D32F2F; font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>',
  className: "custom-div-icon",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

const userIcon = L.divIcon({
  html: '<i class="fa-solid fa-circle-check" style="color: #2E7D32; font-size: 28px; background: white; border-radius: 50%; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>',
  className: "custom-div-icon",
  iconSize: [28, 28],
  iconAnchor: [14, 28],
  popupAnchor: [0, -28],
});

const userLocationIcon = L.divIcon({
  html: '<i class="fa-solid fa-location-dot" style="color: #1976D2; font-size: 24px; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.3));"></i>',
  className: "custom-div-icon",
  iconSize: [24, 24],
  iconAnchor: [12, 24],
  popupAnchor: [0, -24],
});

// Dados Simulados do INPE
const inpeData = [
  { lat: -10.5, lng: -55.0, title: "Foco de Calor - INPE (Mato Grosso)" },
  { lat: -5.0, lng: -60.0, title: "Foco de Calor - INPE (Amazonas)" },
];

inpeData.forEach((data) => {
  L.marker([data.lat, data.lng], { icon: fireIcon })
    .addTo(map)
    .bindPopup(`<b>${data.title}</b><br>Fonte: Satélite Oficial`);
});

// Elementos da UI
const btnReport = document.getElementById("btn-report");
const modalReport = document.getElementById("modal-report");
const btnCloseModal = document.getElementById("btn-close-modal");
const formReport = document.getElementById("form-report");
const btnSubmit = formReport.querySelector(".btn-submit");
const typeBtns = document.querySelectorAll(".type-btn");
const photoInput = document.getElementById("photo-upload");
const fileNameDisplay = document.getElementById("file-name");

// Novos Elementos (Fase 2)
const btnGeo = document.getElementById("btn-geo");
const btnHub = document.getElementById("btn-hub");
const modalHub = document.getElementById("modal-hub");
const btnCloseHub = document.getElementById("btn-close-hub");

let currentUserLocation = null;

// Lógica do Modal Genérica
function toggleModal(modal, show) {
  if (show) {
    modal.classList.remove("hidden");
    setTimeout(() => modal.classList.add("active"), 10);
  } else {
    modal.classList.remove("active");
    setTimeout(() => modal.classList.add("hidden"), 300);
  }
}

// Event Listeners Modais
btnReport.addEventListener("click", () => toggleModal(modalReport, true));
btnCloseModal.addEventListener("click", () => toggleModal(modalReport, false));
btnHub.addEventListener("click", () => toggleModal(modalHub, true));
btnCloseHub.addEventListener("click", () => toggleModal(modalHub, false));

// Fechar ao clicar fora
[modalReport, modalHub].forEach((modal) => {
  modal.addEventListener("click", (e) => {
    if (e.target === modal) toggleModal(modal, false);
  });
});

// Seleção de Tipo de Alerta
typeBtns.forEach((btn) => {
  btn.addEventListener("click", () => {
    typeBtns.forEach((b) => b.classList.remove("selected"));
    btn.classList.add("selected");
  });
});

let currentImageBase64 = null;

// Feedback de Upload de Foto e Conversão Base64
photoInput.addEventListener("change", (e) => {
  if (e.target.files.length > 0) {
    const file = e.target.files[0];
    fileNameDisplay.textContent = file.name;
    fileNameDisplay.style.color = "var(--primary-green)";

    // Converter para Base64
    const reader = new FileReader();
    reader.onload = function (event) {
      currentImageBase64 = event.target.result;
    };
    reader.readAsDataURL(file);
  }
});

// Geolocalização Real
btnGeo.addEventListener("click", () => {
  if (!navigator.geolocation) {
    alert("Geolocalização não suportada pelo seu navegador.");
    return;
  }

  btnGeo.innerHTML = '<i class="fa-solid fa-spinner fa-spin"></i>';

  navigator.geolocation.getCurrentPosition(
    (position) => {
      const { latitude, longitude } = position.coords;
      currentUserLocation = { lat: latitude, lng: longitude };

      // Centralizar mapa
      map.setView([latitude, longitude], 15);

      // Adicionar marcador de localização atual (se não existir)
      // Limpar marcadores anteriores de localização se necessário (opcional)
      L.marker([latitude, longitude], { icon: userLocationIcon })
        .addTo(map)
        .bindPopup("Sua Localização Atual")
        .openPopup();

      btnGeo.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';
      btnGeo.style.color = "#1976D2"; // Feedback visual de sucesso
    },
    (error) => {
      console.error(error);
      alert("Erro ao obter localização. Verifique as permissões.");
      btnGeo.innerHTML = '<i class="fa-solid fa-crosshairs"></i>';
    }
  );
});

// Função para Adicionar Marcador e Zona de Impacto
function adicionarMarcador(lat, lng, type, count, imageUrl) {
  // Definir cor baseada no tipo
  let color = "#2E7D32"; // Default (Verde/User)
  let title = "Novo Alerta";

  if (type === "fire") {
    color = "#D32F2F"; // Vermelho
    title = "Foco de Incêndio";
  } else if (type === "flood") {
    color = "#1976D2"; // Azul
    title = "Ponto de Alagamento";
  } else if (type === "landslide") {
    color = "#E65100"; // Laranja/Marrom
    title = "Risco de Deslizamento";
  }

  // 1. Adicionar Círculo (Zona de Impacto)
  L.circle([lat, lng], {
    color: color,
    fillColor: color,
    fillOpacity: 0.2,
    radius: 100, // 100 metros
    weight: 1,
  }).addTo(map);

  // 2. Adicionar Marcador (Ícone)
  const newMarker = L.marker([lat, lng], { icon: userIcon }).addTo(map);

  // Construir conteúdo do popup
  let popupContent = `
        <b>${title}</b><br>
        Status: Aguardando Confirmação<br>
        <span style="color: ${color}; font-weight: bold;">
            <i class="fa-solid fa-users"></i> Confirmado por <span class="confirmation-count">${count}</span> pessoas
        </span>
        <br>
        <button onclick="confirmarAlerta(this)" style="margin-top: 8px; padding: 5px 10px; background-color: #1976D2; color: white; border: none; border-radius: 4px; cursor: pointer; font-size: 0.9em;">
            EU TAMBÉM VI (+1)
        </button>
    `;

  // Adicionar imagem se existir
  if (imageUrl) {
    popupContent += `<br><img src="${imageUrl}" class="popup-image" alt="Foto do local">`;
  }

  newMarker.bindPopup(popupContent).openPopup();
}

// Função de Confirmação de Alerta
function confirmarAlerta(btn) {
  // Encontrar o elemento pai (container do popup)
  const container = btn.parentElement;

  // Encontrar o contador
  const counterElement = container.querySelector(".confirmation-count");

  if (counterElement) {
    // Pegar número atual e somar 1
    let currentCount = parseInt(counterElement.textContent);
    currentCount++;
    counterElement.textContent = currentCount;

    // Atualizar estilo do botão
    btn.style.backgroundColor = "#2E7D32"; // Verde
    btn.textContent = "Confirmado ✓";
    btn.disabled = true;
    btn.style.cursor = "default";

    // Feedback ao usuário
    alert("Obrigado! A prioridade deste alerta foi elevada.");
    console.log("Alerta confirmado. Nova contagem:", currentCount);
  } else {
    console.error("Erro: Contador não encontrado.");
  }
}

// Fluxo de Envio de Reporte
formReport.addEventListener("submit", (e) => {
  e.preventDefault();

  if (!currentUserLocation) {
    // Tentar pegar localização automaticamente se não tiver
    alert(
      "Precisamos da sua localização para enviar o alerta. Ative o GPS clicando no ícone de mira."
    );
    return;
  }

  // Feedback Visual
  const originalText = btnSubmit.textContent;
  btnSubmit.textContent = "ENVIANDO...";
  btnSubmit.disabled = true;
  btnSubmit.style.opacity = "0.8";

  // Simulação de Rede (1.5s)
  setTimeout(() => {
    btnSubmit.textContent = originalText;
    btnSubmit.disabled = false;
    btnSubmit.style.opacity = "1";

    toggleModal(modalReport, false);

    alert("Alerta enviado com sucesso! Sua observação tem poder.");

    // Gerar contagem aleatória para simulação social
    const randomCount = Math.floor(Math.random() * 5) + 1;

    // Identificar tipo selecionado
    const selectedTypeBtn = document.querySelector(".type-btn.selected");
    const type = selectedTypeBtn ? selectedTypeBtn.dataset.type : "general";

    // Chamar nova função com a imagem
    adicionarMarcador(
      currentUserLocation.lat,
      currentUserLocation.lng,
      type,
      randomCount,
      currentImageBase64
    );

    // Resetar formulário e variáveis
    formReport.reset();
    currentImageBase64 = null;
    typeBtns.forEach((b) => b.classList.remove("selected"));
    fileNameDisplay.textContent = "Nenhum arquivo selecionado";
    fileNameDisplay.style.color = "#666";
  }, 1500);
});

// Marcador de Teste (Savassi)
adicionarMarcador(-19.9331551576752, -43.93706052985416, 'fire', 1, null);
map.setView([-19.9331551576752, -43.93706052985416], 15);

// Funcionalidade de Copiar Números de Emergência (Individual)
const copyBtns = document.querySelectorAll('.copy-btn-mini');
copyBtns.forEach(btn => {
    btn.addEventListener('click', () => {
        const numberToCopy = btn.dataset.number;
        
        if (numberToCopy) {
            navigator.clipboard.writeText(numberToCopy).then(() => {
                // Feedback Visual
                const originalIcon = btn.innerHTML;
                btn.innerHTML = '<i class="fa-solid fa-check" style="color: var(--primary-green);"></i>';
                
                setTimeout(() => {
                    btn.innerHTML = originalIcon;
                }, 2000);
            }).catch(err => {
                console.error('Erro ao copiar:', err);
                alert('Não foi possível copiar o número.');
            });
        }
    });
});
