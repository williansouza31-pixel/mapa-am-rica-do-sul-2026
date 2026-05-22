<?php
header('Content-Type: application/json');

$id = isset($_GET['id']) ? $_GET['id'] : '';
$year = isset($_GET['year']) ? (int)$_GET['year'] : 2026;

$mascots = [
    'BR-AM' => '🦜', 'BR-SP' => '🦦', 'BR-RJ' => '🐒', 'BR-MG' => '🐺', 'BR-BA' => '🐊', 'BR-RS' => '🦅',
    'GENERIC-PROV1' => '🦙', 'GENERIC-PROV2' => '🦅'
];
$currentMascot = isset($mascots[$id]) ? $mascots[$id] : '🦊';

$dialogues = [];

if ($year === 2026) {
    if (strpos($id, 'GENERIC-') !== false) {
        $dialogues = [
            "Saudações territoriais! Neste ano de 2026, nossa infraestrutura transandina conectou linhas de trem de carga de alta eficiência comercial.",
            "Dados econômicos de 2026: Os acordos comerciais do Mercosul foram modernizados, impulsionando transações via moedas digitais integradas.",
            "Em 2026, nossas reservas florestais e biomas montanhosos receberam proteção integrada monitorada por satélites compartilhados.",
            "A matriz de conexão energética regional bateu recordes de fornecimento limpo vindo de usinas hidroelétricas e solares parceiras este ano!"
        ];
    } else {
        switch($id) {
            case 'BR-SP':
                $dialogues = [
                    "Você sabia que em São Paulo, neste ano de 2026, as capivaras do Rio Pinheiros são todas monitoradas por coleiras ecológicas com dados via satélite?",
                    "Fato Econômico 2026: A capital paulista atingiu a marca histórica de maior frota de ônibus movidos a hidrogênio verde de todo o hemisfério sul!",
                    "A USP inaugurou este ano o seu primeiro supercomputador quântico voltado para simulação climática da América Latina.",
                    "O trem expresso de média velocidade que liga São Paulo a Campinas iniciou suas primeiras operações comerciais neste trimestre!"
                ];
                break;
            case 'BR-AM':
                $dialogues = [
                    "Aqui no Amazonas, em 2026, o Polo Industrial de Manaus iniciou a produção em massa das primeiras baterias de grafeno ecológico do país.",
                    "Pesquisadores em 2026 usaram bio-drones inteligentes para catalogar novas variações de plantas medicinais profundas da floresta.",
                    "Neste ano, o sistema de monitoramento aeroespacial reduziu os focos de desmatamento ilegal na Amazônia aos menores níveis em duas décadas.",
                    "A navegação pelos rios Negro e Solimões agora conta com balsas comunitárias 100% movidas a painéis fotovoltaicos solares!"
                ];
                break;
            default:
                $dialogues = [
                    "Fato de 2026: Este território descentralizou sua matriz energética, agora operando quase inteiramente com energia eólica e solar limpa.",
                    "A infraestrutura de agronegócio desta região bateu recorde de eficiência logística automatizada usando dados integrados neste ano.",
                    "Novas políticas integradas de educação tecnológica começaram a aplicar robótica avançada nas escolas da rede pública estadual.",
                    "A malha viária e de transportes local recebeu volumosos investimentos em asfalto térmico sustentável ao longo de 2026."
                ];
                break;
        }
    }
} else {
    if ($year >= 1800 && $year < 1822) {
        $dialogues = [
            "No ano de $year, a América do Sul ferve com as campanhas de libertação lideradas por Simon Bolívar e José de San Martín contra o domínio espanhol.",
            "O território brasileiro abriga a Corte Portuguesa de D. João VI, que elevou o país a Reino Unido a Portugal e Algarves.",
            "As divisões administrativas ainda operam sob o modelo de colônias, vice-reinados e capitanias hereditárias.",
            "A exploração comercial de ouro, prata e produtos agrícolas atende diretamente às exigências tributárias europeias das metrópoles."
        ];
    } else {
        $dialogues = [
            "No ano de $year, as nações da América do Sul já consolidaram suas respectivas soberanias nacionais após acordos de fronteiras.",
            "O século passado viu a transição das antigas economias imperiais para as estruturas de repúblicas modernas e industrializadas.",
            "Grandes redes ferroviárias e linhas de telégrafo foram cruciais para ligar as capitais aos polos produtores rurais profundos.",
            "A identidade cultural sul-americana consolidou-se internacionalmente através da exportação de arte, música e conquistas esportivas."
        ];
    }
}

echo json_encode([
    'mascot' => $currentMascot,
    'dialogues' => $dialogues
]);
?>