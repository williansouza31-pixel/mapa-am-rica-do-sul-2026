<?php
header('Content-Type: application/json; charset=utf-8');

$id = isset($_GET['id']) ? trim($_GET['id']) : '';
$year = isset($_GET['year']) ? (int)$_GET['year'] : 2026;

$statesFile = __DIR__ . '/data/states.json';
$states = [];
if (file_exists($statesFile)) {
    $json = file_get_contents($statesFile);
    $decoded = json_decode($json, true);
    if (is_array($decoded)) {
        $states = $decoded;
    }
}

// Construir mapa de mascotes
$mascots = [];
foreach ($states as $code => $info) {
    if (isset($info['mascot'])) $mascots[$code] = $info['mascot'];
}

// Mascote padrão
$defaultMascot = '🦊';
$currentMascot = isset($mascots[$id]) ? $mascots[$id] : $defaultMascot;

// Fallback genérico para diálogos históricos
function genericDialogues($year) {
    if ($year === 2026) {
        return [
            "Fato de 2026: Este estado descentralizou sua matriz energética, agora operando quase inteiramente com energia eólica e solar limpa.",
            "A infraestrutura de agronegócio desta região bateu recorde de eficiência logística automatizada usando dados integrados neste ano.",
            "Novas políticas integradas de educação tecnológica começaram a aplicar robótica avançada nas escolas da rede pública estadual.",
            "A malha viária e de transportes local recebeu volumosos investimentos em asfalto térmico sustentável ao longo de 2026."
        ];
    }
    if ($year >= 1800 && $year < 1822) {
        return [
            "No ano de $year, a América do Sul ferve com as campanhas de libertação lideradas por Simon Bolívar e José de San Martín contra o domínio espanhol.",
            "O território brasileiro abriga a Corte Portuguesa de D. João VI, que elevou o país a Reino Unido a Portugal e Algarves.",
            "As divisões administrativas ainda operam sob o modelo de colônias, vice-reinados e capitanias hereditárias.",
            "A exploração comercial de ouro, prata e produtos agrícolas atende diretamente às exigências tributárias europeias das metrópoles."
        ];
    }
    return [
        "No ano de $year, as nações da América do Sul já consolidam suas respectivas soberanias nacionais após acordos de fronteiras.",
        "O século passado viu a transição das antigas economias imperiais para as estruturas de repúblicas modernas e industrializadas.",
        "Grandes redes ferroviárias e linhas de telégrafo foram cruciais para ligar as capitais aos polos produtores rurais profundos.",
        "A identidade cultural sul-americana consolidou-se internacionalmente através da exportação de arte, música e conquistas esportivas."
    ];
}

// Normaliza a estrutura de 'extras' para garantir arrays e sub-chaves esperadas pelo front-end
function normalize_extras($extras) {
    $defaults = [
        'curiosidades' => [],
        'destaques' => [
            'positivos' => [],
            'desafios' => [],
            'geografia' => [],
            'numeros' => []
        ],
        'personalidades' => [],
        'invencoes' => [],
        'economia' => [],
        'turismo' => []
    ];

    if (!is_array($extras)) return $defaults;

    // Se existirem geografia/numeros no topo, capture-os para mesclar depois
    $top_geografia = [];
    $top_numeros = [];
    if (isset($extras['geografia'])) {
        if (is_array($extras['geografia'])) $top_geografia = $extras['geografia'];
        elseif (is_string($extras['geografia'])) $top_geografia = [$extras['geografia']];
    }
    if (isset($extras['numeros'])) {
        if (is_array($extras['numeros'])) $top_numeros = $extras['numeros'];
        elseif (is_string($extras['numeros'])) $top_numeros = [$extras['numeros']];
    }

    // garante chaves de topo e tipos
    foreach ($defaults as $key => $defVal) {
        if (!array_key_exists($key, $extras)) {
            $extras[$key] = $defVal;
            continue;
        }

        if ($key === 'destaques') {
            // prepara destaques como array
            if (!is_array($extras['destaques'])) {
                if (is_string($extras['destaques'])) {
                    $extras['destaques'] = ['positivos' => [$extras['destaques']]];
                } else {
                    $extras['destaques'] = $defVal;
                }
            }
            // garante sub-chaves e tipos corretos
            foreach ($defVal as $subKey => $subDef) {
                if (!isset($extras['destaques'][$subKey]) || !is_array($extras['destaques'][$subKey])) {
                    if (isset($extras['destaques'][$subKey]) && is_string($extras['destaques'][$subKey])) {
                        $extras['destaques'][$subKey] = [$extras['destaques'][$subKey]];
                    } else {
                        $extras['destaques'][$subKey] = $subDef;
                    }
                }
            }
        } else {
            // outros campos devem ser arrays de strings
            if (!is_array($extras[$key])) {
                if (is_string($extras[$key])) {
                    $extras[$key] = [$extras[$key]];
                } else {
                    $extras[$key] = $defVal;
                }
            }
        }
    }

    // Agora mescla top_geografia / top_numeros (se existirem) dentro de destaques
    if (!empty($top_geografia)) {
        $merged = array_merge($extras['destaques']['geografia'], $top_geografia);
        // remove duplicatas mantendo ordem
        $extras['destaques']['geografia'] = array_values(array_unique($merged));
    }
    if (!empty($top_numeros)) {
        $merged = array_merge($extras['destaques']['numeros'], $top_numeros);
        $extras['destaques']['numeros'] = array_values(array_unique($merged));
    }

    // Remove possíveis entradas top-level duplicadas para evitar confusão no front
    if (isset($extras['geografia'])) unset($extras['geografia']);
    if (isset($extras['numeros'])) unset($extras['numeros']);

    return $extras;
}

// Preparar resposta
$dialogues = [];
$extras = [];

if ($id !== '' && isset($states[$id])) {
    $state = $states[$id];
    if (isset($state['mascot'])) $currentMascot = $state['mascot'];

    if ($year === 2026) {
        $dialogues = isset($state['dialogues']) ? $state['dialogues'] : genericDialogues(2026);
        $extras = isset($state['extras']) ? $state['extras'] : [];
    } else {
        if (isset($state['by_year']) && isset($state['by_year'][(string)$year])) {
            $dialogues = $state['by_year'][(string)$year]['dialogues'] ?? genericDialogues($year);
            $extras = $state['by_year'][(string)$year]['extras'] ?? [];
        } else {
            $dialogues = genericDialogues($year);
            $extras = $state['extras_historic'] ?? [];
        }
    }
} else {
    $dialogues = genericDialogues($year);
    $extras = [];
}

// Normaliza 'extras' antes de retornar, para o front exibir tudo corretamente
$extras = normalize_extras($extras);

echo json_encode([
    'mascot' => $currentMascot,
    'dialogues' => $dialogues,
    'extras' => $extras
], JSON_UNESCAPED_UNICODE);
?>