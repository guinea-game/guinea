// Metro requires static require() calls — no dynamic `guinea-${outfit}-idle.png` strings.
// This file is the one place that enumerates every sprite strip and small icon.
import type { Outfit } from "./types";

export const spriteSheets = {
  guinea: {
    default: {
      idle: require("../assets/sprites/guinea-idle-strip.webp"),
      attack: require("../assets/sprites/guinea-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-critical-strip.webp"),
      win: require("../assets/sprites/guinea-win-strip.webp"),
    },
    explorerHamster: {
      idle: require("../assets/sprites/guinea-explorer-hamster-idle-strip.webp"),
      attack: require("../assets/sprites/guinea-explorer-hamster-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-explorer-hamster-critical-strip.webp"),
      win: require("../assets/sprites/guinea-explorer-hamster-win-strip.webp"),
    },
    tetoGini: {
      idle: require("../assets/sprites/guinea-teto-idle-strip.webp"),
      // Critical reuses the attack strip verbatim — no separate critical art for this outfit.
      attack: require("../assets/sprites/guinea-teto-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-teto-attack-strip.webp"),
      win: require("../assets/sprites/guinea-teto-win-strip.webp"),
    },
    assassinGini: {
      idle: require("../assets/sprites/guinea-assassin-idle-strip.webp"),
      attack: require("../assets/sprites/guinea-assassin-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-assassin-critical-strip.webp"),
      win: require("../assets/sprites/guinea-assassin-win-strip.webp"),
    },
    egenGini: {
      idle: require("../assets/sprites/guinea-egen-idle-strip.webp"),
      attack: require("../assets/sprites/guinea-egen-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-egen-critical-strip.webp"),
      win: require("../assets/sprites/guinea-egen-win-strip.webp"),
    },
    samuraiGini: {
      idle: require("../assets/sprites/guinea-samurai-idle-strip.webp"),
      attack: require("../assets/sprites/guinea-samurai-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-samurai-critical-strip.webp"),
      win: require("../assets/sprites/guinea-samurai-win-strip.webp"),
    },
    chefGini: {
      idle: require("../assets/sprites/guinea-chef-idle-strip.webp"),
      attack: require("../assets/sprites/guinea-chef-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-chef-critical-strip.webp"),
      win: require("../assets/sprites/guinea-chef-win-strip.webp"),
    },
    boxerGini: {
      idle: require("../assets/sprites/guinea-boxer-idle-strip.webp"),
      attack: require("../assets/sprites/guinea-boxer-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-boxer-critical-strip.webp"),
      win: require("../assets/sprites/guinea-boxer-win-strip.webp"),
    },
    witchGini: {
      idle: require("../assets/sprites/witch-gini-idle-strip.webp"),
      attack: require("../assets/sprites/witch-gini-attack-strip.webp"),
      critical: require("../assets/sprites/witch-gini-critical-strip.webp"),
      win: require("../assets/sprites/witch-gini-win-strip.webp"),
    },
    cowboyGini: {
      idle: require("../assets/sprites/cowboy-gini-idle-strip.webp"),
      attack: require("../assets/sprites/cowboy-gini-attack-strip.webp"),
      critical: require("../assets/sprites/cowboy-gini-critical-strip.webp"),
      win: require("../assets/sprites/cowboy-gini-win-strip.webp"),
    },
    // No art of its own — it's 모험기니 at reduced opacity (CharacterSprite's OPACITY table),
    // which is the entire point: there's nothing to it besides being see-through.
    transparentGini: {
      idle: require("../assets/sprites/guinea-idle-strip.webp"),
      attack: require("../assets/sprites/guinea-attack-strip.webp"),
      critical: require("../assets/sprites/guinea-critical-strip.webp"),
      win: require("../assets/sprites/guinea-win-strip.webp"),
    },
    // 기니상자 전용 코스메틱 동료 — 능력 없음, 전용 스프라이트만 있음.
    nurseGini: {
      idle: require("../assets/sprites/nurse-gini-idle-strip.webp"),
      attack: require("../assets/sprites/nurse-gini-attack-strip.webp"),
      critical: require("../assets/sprites/nurse-gini-critical-strip.webp"),
      win: require("../assets/sprites/nurse-gini-win-strip.webp"),
    },
    archerGini: {
      idle: require("../assets/sprites/archer-gini-idle-strip.webp"),
      attack: require("../assets/sprites/archer-gini-attack-strip.webp"),
      critical: require("../assets/sprites/archer-gini-critical-strip.webp"),
      win: require("../assets/sprites/archer-gini-win-strip.webp"),
    },
    detectiveGini: {
      idle: require("../assets/sprites/detective-gini-idle-strip.webp"),
      attack: require("../assets/sprites/detective-gini-attack-strip.webp"),
      critical: require("../assets/sprites/detective-gini-critical-strip.webp"),
      win: require("../assets/sprites/detective-gini-win-strip.webp"),
    },
    plainGini: {
      idle: require("../assets/sprites/plain-gini-idle-strip.webp"),
      attack: require("../assets/sprites/plain-gini-attack-strip.webp"),
      critical: require("../assets/sprites/plain-gini-critical-strip.webp"),
      win: require("../assets/sprites/plain-gini-win-strip.webp"),
    },
    knightGini: {
      idle: require("../assets/sprites/knight-gini-idle-strip.webp"),
      attack: require("../assets/sprites/knight-gini-attack-strip.webp"),
      critical: require("../assets/sprites/knight-gini-critical-strip.webp"),
      win: require("../assets/sprites/knight-gini-win-strip.webp"),
    },
    sageGini: {
      idle: require("../assets/sprites/sage-gini-idle-strip.webp"),
      attack: require("../assets/sprites/sage-gini-attack-strip.webp"),
      critical: require("../assets/sprites/sage-gini-critical-strip.webp"),
      win: require("../assets/sprites/sage-gini-win-strip.webp"),
    },
  },
  slime: {
    idle: require("../assets/sprites/slime-idle-strip.webp"),
    hit: require("../assets/sprites/slime-hit-strip.webp"),
    die: require("../assets/sprites/slime-die-strip.webp"),
  },
  mushroom: {
    idle: require("../assets/sprites/mushroom-idle-strip.webp"),
    hit: require("../assets/sprites/mushroom-hit-strip.webp"),
    die: require("../assets/sprites/mushroom-die-strip.webp"),
  },
  carrot: {
    idle: require("../assets/sprites/carrot-rabbit-idle-strip.webp"),
    hit: require("../assets/sprites/carrot-rabbit-hit-strip.webp"),
    die: require("../assets/sprites/carrot-rabbit-die-strip.webp"),
  },
  bossSlime: {
    idle: require("../assets/sprites/boss-slime-idle-strip.webp"),
    hit: require("../assets/sprites/boss-slime-hit-strip.webp"),
    die: require("../assets/sprites/boss-slime-die-strip.webp"),
  },
  bossMushroom: {
    idle: require("../assets/sprites/boss-mushroom-idle-strip.webp"),
    hit: require("../assets/sprites/boss-mushroom-hit-strip.webp"),
    die: require("../assets/sprites/boss-mushroom-die-strip.webp"),
  },
  bossCarrotGiant: {
    idle: require("../assets/sprites/boss-carrot-giant-idle-strip.webp"),
    hit: require("../assets/sprites/boss-carrot-giant-hit-strip.webp"),
    die: require("../assets/sprites/boss-carrot-giant-die-strip.webp"),
  },
  chicken: {
    idle: require("../assets/sprites/chick-egg-idle-strip.webp"),
    hit: require("../assets/sprites/chick-egg-hit-strip.webp"),
    die: require("../assets/sprites/chick-egg-die-strip.webp"),
  },
  bossChicken: {
    idle: require("../assets/sprites/boss-chick-idle-strip.webp"),
    hit: require("../assets/sprites/boss-chick-hit-strip.webp"),
    die: require("../assets/sprites/boss-chick-die-strip.webp"),
  },
  potato: {
    idle: require("../assets/sprites/little-potato-idle-strip.webp"),
    hit: require("../assets/sprites/little-potato-hit-strip.webp"),
    die: require("../assets/sprites/little-potato-die-strip.webp"),
  },
  bossPotato: {
    idle: require("../assets/sprites/boss-potato-idle-strip.webp"),
    hit: require("../assets/sprites/boss-potato-hit-strip.webp"),
    die: require("../assets/sprites/boss-potato-die-strip.webp"),
  },
  mouse: {
    idle: require("../assets/sprites/city-mouse-idle-strip.webp"),
    hit: require("../assets/sprites/city-mouse-hit-strip.webp"),
    die: require("../assets/sprites/city-mouse-die-strip.webp"),
  },
  bossFatCat: {
    idle: require("../assets/sprites/boss-fatcat-idle-strip.webp"),
    hit: require("../assets/sprites/boss-fatcat-hit-strip.webp"),
    die: require("../assets/sprites/boss-fatcat-die-strip.webp"),
  },
  cauldron: {
    idle: require("../assets/sprites/cauldron-idle-strip.webp"),
    hit: require("../assets/sprites/cauldron-hit-strip.webp"),
    die: require("../assets/sprites/cauldron-die-strip.webp"),
  },
  bossFridge: {
    idle: require("../assets/sprites/boss-fridge-idle-strip.webp"),
    hit: require("../assets/sprites/boss-fridge-hit-strip.webp"),
    die: require("../assets/sprites/boss-fridge-die-strip.webp"),
  },
  mudskipper: {
    idle: require("../assets/sprites/mudskipper-idle-strip.webp"),
    hit: require("../assets/sprites/mudskipper-hit-strip.webp"),
    die: require("../assets/sprites/mudskipper-die-strip.webp"),
  },
  bossKingCrab: {
    idle: require("../assets/sprites/boss-kingcrab-idle-strip.webp"),
    hit: require("../assets/sprites/boss-kingcrab-hit-strip.webp"),
    die: require("../assets/sprites/boss-kingcrab-die-strip.webp"),
  },
  bluefish: {
    idle: require("../assets/sprites/bluefish-idle-strip.webp"),
    hit: require("../assets/sprites/bluefish-hit-strip.webp"),
    die: require("../assets/sprites/bluefish-die-strip.webp"),
  },
  bossShark: {
    idle: require("../assets/sprites/boss-shark-idle-strip.webp"),
    hit: require("../assets/sprites/boss-shark-hit-strip.webp"),
    die: require("../assets/sprites/boss-shark-die-strip.webp"),
  },
  salamander: {
    idle: require("../assets/sprites/lava-salamander-idle-strip.webp"),
    hit: require("../assets/sprites/lava-salamander-hit-strip.webp"),
    die: require("../assets/sprites/lava-salamander-die-strip.webp"),
  },
  bossLavaSlime: {
    idle: require("../assets/sprites/boss-lavaslime-idle-strip.webp"),
    hit: require("../assets/sprites/boss-lavaslime-hit-strip.webp"),
    die: require("../assets/sprites/boss-lavaslime-die-strip.webp"),
  },
  monkey: {
    idle: require("../assets/sprites/banasungi-idle-strip.webp"),
    hit: require("../assets/sprites/banasungi-hit-strip.webp"),
    die: require("../assets/sprites/banasungi-die-strip.webp"),
  },
  bossCarnivorousPlant: {
    idle: require("../assets/sprites/boss-carnivorous-plant-idle-strip.webp"),
    hit: require("../assets/sprites/boss-carnivorous-plant-hit-strip.webp"),
    die: require("../assets/sprites/boss-carnivorous-plant-die-strip.webp"),
  },
  carp: {
    idle: require("../assets/sprites/ingeo-idle-strip.webp"),
    hit: require("../assets/sprites/ingeo-hit-strip.webp"),
    die: require("../assets/sprites/ingeo-die-strip.webp"),
  },
  bossStreamDragon: {
    idle: require("../assets/sprites/boss-stream-dragon-idle-strip.webp"),
    hit: require("../assets/sprites/boss-stream-dragon-hit-strip.webp"),
    die: require("../assets/sprites/boss-stream-dragon-die-strip.webp"),
  },
  cactus: {
    idle: require("../assets/sprites/cactus-idle-strip.webp"),
    hit: require("../assets/sprites/cactus-hit-strip.webp"),
    die: require("../assets/sprites/cactus-die-strip.webp"),
  },
  bossDehydratedCamel: {
    idle: require("../assets/sprites/boss-dehydrated-camel-idle-strip.webp"),
    hit: require("../assets/sprites/boss-dehydrated-camel-hit-strip.webp"),
    die: require("../assets/sprites/boss-dehydrated-camel-die-strip.webp"),
  },
  fox: {
    idle: require("../assets/sprites/desert-fox-idle-strip.webp"),
    hit: require("../assets/sprites/desert-fox-hit-strip.webp"),
    die: require("../assets/sprites/desert-fox-die-strip.webp"),
  },
  bossRattlesnake: {
    idle: require("../assets/sprites/boss-rattlesnake-idle-strip.webp"),
    hit: require("../assets/sprites/boss-rattlesnake-hit-strip.webp"),
    die: require("../assets/sprites/boss-rattlesnake-die-strip.webp"),
  },
  lizard: {
    idle: require("../assets/sprites/night-lizard-idle-strip.webp"),
    hit: require("../assets/sprites/night-lizard-hit-strip.webp"),
    die: require("../assets/sprites/night-lizard-die-strip.webp"),
  },
  bossHauntedGoat: {
    idle: require("../assets/sprites/boss-haunted-goat-idle-strip.webp"),
    hit: require("../assets/sprites/boss-haunted-goat-hit-strip.webp"),
    die: require("../assets/sprites/boss-haunted-goat-die-strip.webp"),
  },
  mantou: {
    idle: require("../assets/sprites/mantou-man-idle-strip.webp"),
    hit: require("../assets/sprites/mantou-man-hit-strip.webp"),
    die: require("../assets/sprites/mantou-man-die-strip.webp"),
  },
  bossBambooPanda: {
    idle: require("../assets/sprites/boss-bamboo-panda-idle-strip.webp"),
    hit: require("../assets/sprites/boss-bamboo-panda-hit-strip.webp"),
    die: require("../assets/sprites/boss-bamboo-panda-die-strip.webp"),
  },
  pig: {
    idle: require("../assets/sprites/pig-grunt-idle-strip.webp"),
    hit: require("../assets/sprites/pig-grunt-hit-strip.webp"),
    die: require("../assets/sprites/pig-grunt-die-strip.webp"),
  },
  bossTurtleSpirit: {
    idle: require("../assets/sprites/boss-turtle-spirit-idle-strip.webp"),
    hit: require("../assets/sprites/boss-turtle-spirit-hit-strip.webp"),
    die: require("../assets/sprites/boss-turtle-spirit-die-strip.webp"),
  },
  magpie: {
    idle: require("../assets/sprites/magpie-persimmon-idle-strip.webp"),
    hit: require("../assets/sprites/magpie-persimmon-hit-strip.webp"),
    die: require("../assets/sprites/magpie-persimmon-die-strip.webp"),
  },
  bossTigerSpirit: {
    idle: require("../assets/sprites/boss-tiger-spirit-idle-strip.webp"),
    hit: require("../assets/sprites/boss-tiger-spirit-hit-strip.webp"),
    die: require("../assets/sprites/boss-tiger-spirit-die-strip.webp"),
  },
  snowRabbit: {
    idle: require("../assets/sprites/snow-rabbit-idle-strip.webp"),
    hit: require("../assets/sprites/snow-rabbit-hit-strip.webp"),
    die: require("../assets/sprites/snow-rabbit-die-strip.webp"),
  },
  bossIceGolem: {
    idle: require("../assets/sprites/boss-ice-golem-idle-strip.webp"),
    hit: require("../assets/sprites/boss-ice-golem-hit-strip.webp"),
    die: require("../assets/sprites/boss-ice-golem-die-strip.webp"),
  },
  drunkCat: {
    idle: require("../assets/sprites/drunk-cat-idle-strip.webp"),
    hit: require("../assets/sprites/drunk-cat-hit-strip.webp"),
    die: require("../assets/sprites/drunk-cat-die-strip.webp"),
  },
  bossTavernKeeper: {
    idle: require("../assets/sprites/boss-tavern-keeper-idle-strip.webp"),
    hit: require("../assets/sprites/boss-tavern-keeper-hit-strip.webp"),
    die: require("../assets/sprites/boss-tavern-keeper-die-strip.webp"),
  },
  flowerSnake: {
    idle: require("../assets/sprites/flower-snake-idle-strip.webp"),
    hit: require("../assets/sprites/flower-snake-hit-strip.webp"),
    die: require("../assets/sprites/flower-snake-die-strip.webp"),
  },
  bossNineTailedFox: {
    idle: require("../assets/sprites/boss-nine-tailed-fox-idle-strip.webp"),
    hit: require("../assets/sprites/boss-nine-tailed-fox-hit-strip.webp"),
    die: require("../assets/sprites/boss-nine-tailed-fox-die-strip.webp"),
  },
  riceSack: {
    idle: require("../assets/sprites/rice-sack-idle-strip.webp"),
    hit: require("../assets/sprites/rice-sack-hit-strip.webp"),
    die: require("../assets/sprites/rice-sack-die-strip.webp"),
  },
  bossChiliSack: {
    idle: require("../assets/sprites/boss-chili-sack-idle-strip.webp"),
    hit: require("../assets/sprites/boss-chili-sack-hit-strip.webp"),
    die: require("../assets/sprites/boss-chili-sack-die-strip.webp"),
  },
  mackerel: {
    idle: require("../assets/sprites/mackerel-idle-strip.webp"),
    hit: require("../assets/sprites/mackerel-hit-strip.webp"),
    die: require("../assets/sprites/mackerel-die-strip.webp"),
  },
  bossPirateOctopus: {
    idle: require("../assets/sprites/boss-pirate-octopus-idle-strip.webp"),
    hit: require("../assets/sprites/boss-pirate-octopus-hit-strip.webp"),
    die: require("../assets/sprites/boss-pirate-octopus-die-strip.webp"),
  },
  blossomCrab: {
    idle: require("../assets/sprites/blossom-crab-idle-strip.webp"),
    hit: require("../assets/sprites/blossom-crab-hit-strip.webp"),
    die: require("../assets/sprites/blossom-crab-die-strip.webp"),
  },
  bossBlossomShark: {
    idle: require("../assets/sprites/boss-blossom-shark-idle-strip.webp"),
    hit: require("../assets/sprites/boss-blossom-shark-hit-strip.webp"),
    die: require("../assets/sprites/boss-blossom-shark-die-strip.webp"),
  },
  shrineFox: {
    idle: require("../assets/sprites/shrine-fox-idle-strip.webp"),
    hit: require("../assets/sprites/shrine-fox-hit-strip.webp"),
    die: require("../assets/sprites/shrine-fox-die-strip.webp"),
  },
  bossTanukiMerchant: {
    idle: require("../assets/sprites/boss-tanuki-merchant-idle-strip.webp"),
    hit: require("../assets/sprites/boss-tanuki-merchant-hit-strip.webp"),
    die: require("../assets/sprites/boss-tanuki-merchant-die-strip.webp"),
  },
  armorBeetle: {
    idle: require("../assets/sprites/armor-beetle-idle-strip.webp"),
    hit: require("../assets/sprites/armor-beetle-hit-strip.webp"),
    die: require("../assets/sprites/armor-beetle-die-strip.webp"),
  },
  bossGoldenShachi: {
    idle: require("../assets/sprites/boss-golden-shachi-idle-strip.webp"),
    hit: require("../assets/sprites/boss-golden-shachi-hit-strip.webp"),
    die: require("../assets/sprites/boss-golden-shachi-die-strip.webp"),
  },
  onsenMonkey: {
    idle: require("../assets/sprites/onsen-monkey-idle-strip.webp"),
    hit: require("../assets/sprites/onsen-monkey-hit-strip.webp"),
    die: require("../assets/sprites/onsen-monkey-die-strip.webp"),
  },
  bossCapybaraInnkeeper: {
    idle: require("../assets/sprites/boss-capybara-innkeeper-idle-strip.webp"),
    hit: require("../assets/sprites/boss-capybara-innkeeper-hit-strip.webp"),
    die: require("../assets/sprites/boss-capybara-innkeeper-die-strip.webp"),
  },
  ninjaFrog: {
    idle: require("../assets/sprites/ninja-frog-idle-strip.webp"),
    hit: require("../assets/sprites/ninja-frog-hit-strip.webp"),
    die: require("../assets/sprites/ninja-frog-die-strip.webp"),
  },
  bossScrollRat: {
    idle: require("../assets/sprites/boss-scroll-rat-idle-strip.webp"),
    hit: require("../assets/sprites/boss-scroll-rat-hit-strip.webp"),
    die: require("../assets/sprites/boss-scroll-rat-die-strip.webp"),
  },
  lanternAngler: {
    idle: require("../assets/sprites/lantern-angler-idle-strip.webp"),
    hit: require("../assets/sprites/lantern-angler-hit-strip.webp"),
    die: require("../assets/sprites/lantern-angler-die-strip.webp"),
  },
  bossSeahorseGeneral: {
    idle: require("../assets/sprites/boss-seahorse-general-idle-strip.webp"),
    hit: require("../assets/sprites/boss-seahorse-general-hit-strip.webp"),
    die: require("../assets/sprites/boss-seahorse-general-die-strip.webp"),
  },
  clamMaid: {
    idle: require("../assets/sprites/clam-maid-idle-strip.webp"),
    hit: require("../assets/sprites/clam-maid-hit-strip.webp"),
    die: require("../assets/sprites/clam-maid-die-strip.webp"),
  },
  bossDragonKing: {
    idle: require("../assets/sprites/boss-dragon-king-idle-strip.webp"),
    hit: require("../assets/sprites/boss-dragon-king-hit-strip.webp"),
    die: require("../assets/sprites/boss-dragon-king-die-strip.webp"),
  },
  gondolaDuck: {
    idle: require("../assets/sprites/gondola-duck-idle-strip.webp"),
    hit: require("../assets/sprites/gondola-duck-hit-strip.webp"),
    die: require("../assets/sprites/gondola-duck-die-strip.webp"),
  },
  bossOvenGolem: {
    idle: require("../assets/sprites/boss-oven-golem-idle-strip.webp"),
    hit: require("../assets/sprites/boss-oven-golem-hit-strip.webp"),
    die: require("../assets/sprites/boss-oven-golem-die-strip.webp"),
  },
  bellCalf: {
    idle: require("../assets/sprites/bell-calf-idle-strip.webp"),
    hit: require("../assets/sprites/bell-calf-hit-strip.webp"),
    die: require("../assets/sprites/bell-calf-die-strip.webp"),
  },
  bossRescueDog: {
    idle: require("../assets/sprites/boss-rescue-dog-idle-strip.webp"),
    hit: require("../assets/sprites/boss-rescue-dog-hit-strip.webp"),
    die: require("../assets/sprites/boss-rescue-dog-die-strip.webp"),
  },
  croissantKid: {
    idle: require("../assets/sprites/croissant-kid-idle-strip.webp"),
    hit: require("../assets/sprites/croissant-kid-hit-strip.webp"),
    die: require("../assets/sprites/croissant-kid-die-strip.webp"),
  },
  bossBaguetteKnight: {
    idle: require("../assets/sprites/boss-baguette-knight-idle-strip.webp"),
    hit: require("../assets/sprites/boss-baguette-knight-hit-strip.webp"),
    die: require("../assets/sprites/boss-baguette-knight-die-strip.webp"),
  },
  sleepyGini: {
    idle: require("../assets/sprites/sleepy-gini-idle-strip.webp"),
    hit: require("../assets/sprites/sleepy-gini-hit-strip.webp"),
    die: require("../assets/sprites/sleepy-gini-die-strip.webp"),
  },
  bossElderGini: {
    idle: require("../assets/sprites/boss-elder-gini-idle-strip.webp"),
    hit: require("../assets/sprites/boss-elder-gini-hit-strip.webp"),
    die: require("../assets/sprites/boss-elder-gini-die-strip.webp"),
  },
  sleepwalkerGini: {
    idle: require("../assets/sprites/sleepwalker-gini-idle-strip.webp"),
    hit: require("../assets/sprites/sleepwalker-gini-hit-strip.webp"),
    die: require("../assets/sprites/sleepwalker-gini-die-strip.webp"),
  },
  bossWitchGini: {
    idle: require("../assets/sprites/boss-witch-gini-idle-strip.webp"),
    hit: require("../assets/sprites/boss-witch-gini-hit-strip.webp"),
    die: require("../assets/sprites/boss-witch-gini-die-strip.webp"),
  },
  candyBasketSlime: {
    idle: require("../assets/sprites/candy-basket-slime-idle-strip.webp"),
    hit: require("../assets/sprites/candy-basket-slime-hit-strip.webp"),
    die: require("../assets/sprites/candy-basket-slime-die-strip.webp"),
  },
  bossPumpkinGolem: {
    idle: require("../assets/sprites/pumpkin-golem-boss-idle-strip.webp"),
    hit: require("../assets/sprites/pumpkin-golem-boss-hit-strip.webp"),
    die: require("../assets/sprites/pumpkin-golem-boss-die-strip.webp"),
  },
  bee: {
    idle: require("../assets/sprites/bee-idle-strip.webp"),
    hit: require("../assets/sprites/bee-hit-strip.webp"),
    die: require("../assets/sprites/bee-die-strip.webp"),
  },
  bossQueenBee: {
    idle: require("../assets/sprites/queen-bee-idle-strip.webp"),
    hit: require("../assets/sprites/queen-bee-hit-strip.webp"),
    die: require("../assets/sprites/queen-bee-die-strip.webp"),
  },
  bossGriffin: {
    idle: require("../assets/sprites/boss-griffin-idle-strip.webp"),
    hit: require("../assets/sprites/boss-griffin-hit-strip.webp"),
    die: require("../assets/sprites/boss-griffin-die-strip.webp"),
  },
  angryCandyBasketSlime: {
    idle: require("../assets/sprites/angry-candy-basket-slime-idle-strip.webp"),
    hit: require("../assets/sprites/angry-candy-basket-slime-hit-strip.webp"),
    die: require("../assets/sprites/angry-candy-basket-slime-die-strip.webp"),
  },
  thiefCrow: {
    idle: require("../assets/sprites/thief-crow-idle-strip.webp"),
    hit: require("../assets/sprites/thief-crow-hit-strip.webp"),
    die: require("../assets/sprites/thief-crow-die-strip.webp"),
  },
  bossHungryRedDragon: {
    idle: require("../assets/sprites/hungry-red-dragon-idle-strip.webp"),
    hit: require("../assets/sprites/hungry-red-dragon-hit-strip.webp"),
    die: require("../assets/sprites/hungry-red-dragon-die-strip.webp"),
  },
  spiceElephant: {
    idle: require("../assets/sprites/spice-elephant-idle-strip.webp"),
    hit: require("../assets/sprites/spice-elephant-hit-strip.webp"),
    die: require("../assets/sprites/spice-elephant-die-strip.webp"),
  },
  bossCurryTiger: {
    idle: require("../assets/sprites/boss-curry-tiger-idle-strip.webp"),
    hit: require("../assets/sprites/boss-curry-tiger-hit-strip.webp"),
    die: require("../assets/sprites/boss-curry-tiger-die-strip.webp"),
  },
  teaYak: {
    idle: require("../assets/sprites/tea-yak-idle-strip.webp"),
    hit: require("../assets/sprites/tea-yak-hit-strip.webp"),
    die: require("../assets/sprites/tea-yak-die-strip.webp"),
  },
  bossChaiYeti: {
    idle: require("../assets/sprites/boss-chai-yeti-idle-strip.webp"),
    hit: require("../assets/sprites/boss-chai-yeti-hit-strip.webp"),
    die: require("../assets/sprites/boss-chai-yeti-die-strip.webp"),
  },
  saffronParrot: {
    idle: require("../assets/sprites/saffron-parrot-idle-strip.webp"),
    hit: require("../assets/sprites/saffron-parrot-hit-strip.webp"),
    die: require("../assets/sprites/saffron-parrot-die-strip.webp"),
  },
  bossPeacockEmperor: {
    idle: require("../assets/sprites/boss-peacock-emperor-idle-strip.webp"),
    hit: require("../assets/sprites/boss-peacock-emperor-hit-strip.webp"),
    die: require("../assets/sprites/boss-peacock-emperor-die-strip.webp"),
  },
  coconutCrab: {
    idle: require("../assets/sprites/coconut-crab-idle-strip.webp"),
    hit: require("../assets/sprites/coconut-crab-hit-strip.webp"),
    die: require("../assets/sprites/coconut-crab-die-strip.webp"),
  },
  bossTomYumCroc: {
    idle: require("../assets/sprites/boss-tomyum-croc-idle-strip.webp"),
    hit: require("../assets/sprites/boss-tomyum-croc-hit-strip.webp"),
    die: require("../assets/sprites/boss-tomyum-croc-die-strip.webp"),
  },
  paddyDuck: {
    idle: require("../assets/sprites/paddy-duck-idle-strip.webp"),
    hit: require("../assets/sprites/paddy-duck-hit-strip.webp"),
    die: require("../assets/sprites/paddy-duck-die-strip.webp"),
  },
  bossBarong: {
    idle: require("../assets/sprites/boss-barong-idle-strip.webp"),
    hit: require("../assets/sprites/boss-barong-hit-strip.webp"),
    die: require("../assets/sprites/boss-barong-die-strip.webp"),
  },
  hulaPineapple: {
    idle: require("../assets/sprites/hula-pineapple-idle-strip.webp"),
    hit: require("../assets/sprites/hula-pineapple-hit-strip.webp"),
    die: require("../assets/sprites/hula-pineapple-die-strip.webp"),
  },
  bossTikiGolem: {
    idle: require("../assets/sprites/boss-tiki-golem-idle-strip.webp"),
    hit: require("../assets/sprites/boss-tiki-golem-hit-strip.webp"),
    die: require("../assets/sprites/boss-tiki-golem-die-strip.webp"),
  },
  prairieDog: {
    idle: require("../assets/sprites/prairie-dog-idle-strip.webp"),
    hit: require("../assets/sprites/prairie-dog-hit-strip.webp"),
    die: require("../assets/sprites/prairie-dog-die-strip.webp"),
  },
  bossBbqBear: {
    idle: require("../assets/sprites/boss-bbq-bear-idle-strip.webp"),
    hit: require("../assets/sprites/boss-bbq-bear-hit-strip.webp"),
    die: require("../assets/sprites/boss-bbq-bear-die-strip.webp"),
  },
  pinataDonkey: {
    idle: require("../assets/sprites/pinata-donkey-idle-strip.webp"),
    hit: require("../assets/sprites/pinata-donkey-hit-strip.webp"),
    die: require("../assets/sprites/pinata-donkey-die-strip.webp"),
  },
  bossMariachiArmadillo: {
    idle: require("../assets/sprites/boss-mariachi-armadillo-idle-strip.webp"),
    hit: require("../assets/sprites/boss-mariachi-armadillo-hit-strip.webp"),
    die: require("../assets/sprites/boss-mariachi-armadillo-die-strip.webp"),
  },
  cacaoSloth: {
    idle: require("../assets/sprites/cacao-sloth-idle-strip.webp"),
    hit: require("../assets/sprites/cacao-sloth-hit-strip.webp"),
    die: require("../assets/sprites/cacao-sloth-die-strip.webp"),
  },
  bossJaguarChocolatier: {
    idle: require("../assets/sprites/boss-jaguar-chocolatier-idle-strip.webp"),
    hit: require("../assets/sprites/boss-jaguar-chocolatier-hit-strip.webp"),
    die: require("../assets/sprites/boss-jaguar-chocolatier-die-strip.webp"),
  },
  grapeSnail: {
    idle: require("../assets/sprites/grape-snail-idle-strip.webp"),
    hit: require("../assets/sprites/grape-snail-hit-strip.webp"),
    die: require("../assets/sprites/grape-snail-die-strip.webp"),
  },
  bossGrapePuma: {
    idle: require("../assets/sprites/boss-grape-puma-idle-strip.webp"),
    hit: require("../assets/sprites/boss-grape-puma-hit-strip.webp"),
    die: require("../assets/sprites/boss-grape-puma-die-strip.webp"),
  },
  llamaCook: {
    idle: require("../assets/sprites/llama-cook-idle-strip.webp"),
    hit: require("../assets/sprites/llama-cook-hit-strip.webp"),
    die: require("../assets/sprites/llama-cook-die-strip.webp"),
  },
  bossSunCondor: {
    idle: require("../assets/sprites/boss-sun-condor-idle-strip.webp"),
    hit: require("../assets/sprites/boss-sun-condor-hit-strip.webp"),
    die: require("../assets/sprites/boss-sun-condor-die-strip.webp"),
  },
};

export const images = {
  titleScreen: require("../assets/sprites/title-screen.webp"),
  // Same scene and framing as titleScreen, at sunset and at night (see TitleScreen's TIME_OF_DAY).
  titleScreenSunset: require("../assets/sprites/title-screen-sunset.webp"),
  titleScreenNight: require("../assets/sprites/title-screen-night.webp"),
  battleBackground: require("../assets/sprites/battle-forest.webp"),
  battleBackgroundMushroom: require("../assets/sprites/battle-mushroom-swamp.webp"),
  battleBackgroundFarm: require("../assets/sprites/battle-farm.webp"),
  battleBackgroundChicken: require("../assets/sprites/battle-chicken-farm.webp"),
  battleBackgroundPotatoCave: require("../assets/sprites/battle-potato-cave.webp"),
  battleBackgroundVillage: require("../assets/sprites/battle-village.webp"),
  battleBackgroundMansionKitchen: require("../assets/sprites/battle-mansion-kitchen.webp"),
  battleBackgroundHarborBeach: require("../assets/sprites/battle-harbor-beach.webp"),
  battleBackgroundSunkenReef: require("../assets/sprites/battle-sunken-reef.webp"),
  battleBackgroundVolcanoIsland: require("../assets/sprites/battle-volcano-island.webp"),
  battleBackgroundTropicalJungle: require("../assets/sprites/battle-tropical-jungle.webp"),
  battleBackgroundOasis: require("../assets/sprites/battle-oasis.webp"),
  battleBackgroundDesert: require("../assets/sprites/battle-desert.webp"),
  battleBackgroundDesertMarket: require("../assets/sprites/battle-desert-market.webp"),
  battleBackgroundSilkRoadNight: require("../assets/sprites/battle-silk-road-night.webp"),
  battleBackgroundBambooCloudCity: require("../assets/sprites/battle-bamboo-cloud-city.webp"),
  battleBackgroundBambooCloudPalace: require("../assets/sprites/battle-bamboo-cloud-palace.webp"),
  battleBackgroundSnowVillage: require("../assets/sprites/battle-snow-village.webp"),
  battleBackgroundSnowMountain: require("../assets/sprites/battle-snow-mountain.webp"),
  battleBackgroundSnowTavern: require("../assets/sprites/battle-snow-tavern.webp"),
  battleBackgroundAzaleaPath: require("../assets/sprites/battle-azalea-path.webp"),
  battleBackgroundJoseonMarket: require("../assets/sprites/battle-joseon-market.webp"),
  battleBackgroundFishingPort: require("../assets/sprites/battle-fishing-port.webp"),
  battleBackgroundBlossomBeach: require("../assets/sprites/battle-blossom-beach.webp"),
  battleBackgroundFoxShrine: require("../assets/sprites/battle-fox-shrine.webp"),
  battleBackgroundCastleKeep: require("../assets/sprites/battle-castle-keep.webp"),
  battleBackgroundHotSpring: require("../assets/sprites/battle-hot-spring-village.webp"),
  battleBackgroundNinjaVillage: require("../assets/sprites/battle-ninja-village.webp"),
  battleBackgroundDragonSeaRoad: require("../assets/sprites/battle-dragon-sea-road.webp"),
  battleBackgroundDragonPalace: require("../assets/sprites/battle-dragon-palace.webp"),
  battleBackgroundCanalCity: require("../assets/sprites/battle-canal-city.webp"),
  battleBackgroundAlpineVillage: require("../assets/sprites/battle-alpine-village.webp"),
  battleBackgroundBakeryStreet: require("../assets/sprites/battle-bakery-street.webp"),
  battleBackgroundGiniMetropolis: require("../assets/sprites/battle-gini-metropolis.webp"),
  battleBackgroundSuspiciousHouse: require("../assets/sprites/battle-suspicious-house.webp"),
  battleBackgroundPumpkinForest: require("../assets/sprites/battle-pumpkin-forest.webp"),
  battleBackgroundHoneyTrail: require("../assets/sprites/battle-honey-trail.webp"),
  battleBackgroundDragonMountainRuin: require("../assets/sprites/battle-dragon-mountain-ruin.webp"),
  battleBackgroundRuinedCitadel: require("../assets/sprites/battle-ruined-citadel.webp"),
  battleBackgroundSpiceBazaar: require("../assets/sprites/battle-spice-bazaar.webp"),
  battleBackgroundHimalayaTea: require("../assets/sprites/battle-himalaya-tea.webp"),
  battleBackgroundMughalGarden: require("../assets/sprites/battle-mughal-garden.webp"),
  battleBackgroundFloatingMarket: require("../assets/sprites/battle-floating-market.webp"),
  battleBackgroundBaliTerraces: require("../assets/sprites/battle-bali-terraces.webp"),
  battleBackgroundHawaiiBeach: require("../assets/sprites/battle-hawaii-beach.webp"),
  battleBackgroundTexasCanyon: require("../assets/sprites/battle-texas-canyon.webp"),
  battleBackgroundTacoFiesta: require("../assets/sprites/battle-taco-fiesta.webp"),
  battleBackgroundCacaoJungle: require("../assets/sprites/battle-cacao-jungle.webp"),
  battleBackgroundAndesVineyard: require("../assets/sprites/battle-andes-vineyard.webp"),
  battleBackgroundSkyCity: require("../assets/sprites/battle-sky-city.webp"),
};

// A 3-frame flash played once over the enemy when a hit lands as a critical.
export const effects = {
  critFlash: require("../assets/sprites/crit-flash-strip.webp"),
  // Guinea Beam: charge → full beam → dissipate. 512x250 each, muzzle ring at the left.
  beam: [
    require("../assets/effects/beam-1.webp"),
    require("../assets/effects/beam-2.webp"),
    require("../assets/effects/beam-3.webp"),
  ],
  // A spinning gold coin, 56x56, 48 frames — exported from the pixelfx effect library via
  // `node tools/pixelfx-export.mjs pickups/coin-spin` (see tools/pixelfx/VENDORED.md).
  coinSpin: require("../assets/effects/coin-spin-strip.webp"),
  // The sustained fire stage of the beam, animated: 264x100, 36 frames, gold-recolored —
  // `node tools/pixelfx-export.mjs arcane/arcane-beam --out beam-fire --opts '{"palette":[...]}'`.
  // Stands in for beam[1] inside BeamArt's fire stage; not part of the `beam` array above.
  beamFire: require("../assets/effects/beam-fire-strip.webp"),
  // One-shot burst layered behind Execute's slash, blood-red recolored: 216x136, 28 frames —
  // `node tools/pixelfx-export.mjs impacts/crit-hit --out execute-burst --opts '{"palette":[...]}'`.
  executeBurst: require("../assets/effects/execute-burst-strip.webp"),
  // One-shot thud where a thrown carrot lands, warm-gold recolored: 128x88, 28 frames —
  // `node tools/pixelfx-export.mjs impacts/blunt-hit --out carrot-impact --opts '{"palette":[...]}'`.
  carrotImpact: require("../assets/effects/carrot-impact-strip.webp"),
  // One-shot flurry of quick cuts on Barrage's cast, red-orange recolored to match its own
  // icon: 148x104, 30 frames — `node tools/pixelfx-export.mjs melee/dagger-flurry --out
  // barrage-flurry --opts '{"palette":[...]}'`.
  barrageFlurry: require("../assets/effects/barrage-flurry-strip.webp"),
  // Looping teleport pad under the player on Teleport's cast — pixelfx's own default purple
  // already matches the skill's own icon, no recolor needed: 96x104, 72 frames —
  // `node tools/pixelfx-export.mjs scifi/teleporter-pad --out teleport-pad`.
  teleportPad: require("../assets/effects/teleport-pad-strip.webp"),
  // The mid-boss's seething aura (anger mark, steam, stress lines, hot floor — none of the
  // effect's own stand-in figure): 80x80, 36 frames looping —
  // `node tools/pixelfx-export.mjs status/rage --out mini-boss-rage --opts '{"body":false}'`.
  miniBossRage: require("../assets/effects/mini-boss-rage-strip.webp"),
  // The mid-boss going down: a gold starburst with sparks (216x216 padded, 28 frames) —
  // `node tools/pixelfx-export.mjs impacts/crit-hit --out mini-boss-burst --square`.
  miniBossBurst: require("../assets/effects/mini-boss-burst-strip.webp"),
  // 운석 낙하's falling rock and impact, pixelfx's own fire palette: 272x232, the first 66
  // frames (2.2s) of 151 — the long smoke tail is faded out in code instead —
  // `node tools/pixelfx-export.mjs fire/meteor --out meteor-strike --max-frames 66`.
  meteorStrike: require("../assets/effects/meteor-strike-strip.png"),
  // 마녀기니's spells (src/components/WitchSpell.tsx), all `--square` padded: five element
  // bolts (looping, flying right) each with its matching hit-spark, plus three big crit
  // bursts. Bolts: projectiles/plasma-shot (arcane / poison palettes), fire/fireball,
  // ice/ice-lance, projectiles/energy-disc. Hits: impacts/hit-spark recolored per element.
  // Crits: impacts/crit-hit (arcane), explosions/plasma-explosion (--max-frames 30),
  // arcane/mana-burst (--max-frames 36).
  witchOrbArcane: require("../assets/effects/witch-orb-arcane-strip.webp"),
  witchOrbFire: require("../assets/effects/witch-orb-fire-strip.webp"),
  witchOrbIce: require("../assets/effects/witch-orb-ice-strip.webp"),
  witchOrbPoison: require("../assets/effects/witch-orb-poison-strip.webp"),
  witchOrbVolt: require("../assets/effects/witch-orb-volt-strip.webp"),
  // Added later: holy (plasma-shot, gold), pink star-disc (energy-disc, pink), ghost fire
  // (fireball, teal) — each with a hit-spark in the same palette.
  witchOrbHoly: require("../assets/effects/witch-orb-holy-strip.webp"),
  witchOrbPink: require("../assets/effects/witch-orb-pink-strip.webp"),
  witchOrbGhost: require("../assets/effects/witch-orb-ghost-strip.webp"),
  witchHitHoly: require("../assets/effects/witch-hit-holy-strip.webp"),
  witchHitPink: require("../assets/effects/witch-hit-pink-strip.webp"),
  witchHitGhost: require("../assets/effects/witch-hit-ghost-strip.webp"),
  witchHitArcane: require("../assets/effects/witch-hit-arcane-strip.webp"),
  witchHitFire: require("../assets/effects/witch-hit-fire-strip.webp"),
  witchHitIce: require("../assets/effects/witch-hit-ice-strip.webp"),
  witchHitPoison: require("../assets/effects/witch-hit-poison-strip.webp"),
  witchHitVolt: require("../assets/effects/witch-hit-volt-strip.webp"),
  witchCritStar: require("../assets/effects/witch-crit-star-strip.webp"),
  witchCritPlasma: require("../assets/effects/witch-crit-plasma-strip.webp"),
  witchCritMana: require("../assets/effects/witch-crit-mana-strip.webp"),
  // Boss skills (src/state/bossSkills.ts): stun variants play over the player (status-effect
  // style, loop), heal variants play over the boss (one-shot, cropped early with --max-frames
  // — both are several seconds of pixelfx's own art, only the opening beat is used here).
  bossStunStunned: require("../assets/effects/stun-stunned-strip.webp"),
  bossStunSleep: require("../assets/effects/stun-sleep-strip.webp"),
  bossStunConfused: require("../assets/effects/stun-confused-strip.webp"),
  bossHealHoly: require("../assets/effects/heal-holy-strip.webp"),
  bossHealBloom: require("../assets/effects/heal-bloom-strip.webp"),
  // 밤의 실크로드's lizard (flavor-texted as a ghost-possessed goat — see stages.ts) comes
  // back from the dead once a fight, guaranteed: a spectral light pillar, 128x150, 50 frames
  // — `node tools/pixelfx-export.mjs spawn/respawn-beam --out boss-revive --max-frames 50`.
  bossRevive: require("../assets/effects/boss-revive-strip.webp"),
  // The burn mark Chili Throw's DoT leaves on the enemy for its duration, fire-recolored:
  // 80x124, 90 frames — `node tools/pixelfx-export.mjs fire/spirit-flame --out chili-burn
  // --opts '{"palette":[...]}'`.
  chiliBurn: require("../assets/effects/chili-burn-strip.webp"),
  // 72x72 (padded from 72x56), 21 frames, 667ms once — 카우보이기니's per-shot flash + smoke.
  // `node tools/pixelfx-export.mjs projectiles/muzzle-revolver --square` (a short-lived variant of
  // projectiles/muzzle-pistol with no casing, added to the vendored pixelfx checkout).
  muzzleRevolver: require("../assets/effects/muzzle-revolver-strip.webp"),
};

export const icons = {
  map: require("../assets/icons/icon-map.webp"),
  // Trimmed to their visible art, for the battle scene's fixed-box button row.
  mapTrim: require("../assets/icons/icon-map-trim.webp"),
  // Battle-row page buttons for the newer contents.
  levelReward: require("../assets/icons/icon-level-reward.webp"),
  // 일일 의뢰: plain = today's requests all done; with the "!" bubble = a fresh set waiting.
  dailyDone: require("../assets/icons/icon-daily-done.webp"),
  dailyNew: require("../assets/icons/icon-daily-new.webp"),
  lab: require("../assets/icons/icon-lab.webp"),
  event: require("../assets/icons/icon-event.webp"),
  backpackTrim: require("../assets/icons/icon-backpack-trim.webp"),
  coins: require("../assets/icons/icon-coins.webp"),
  chest: require("../assets/icons/icon-chest.webp"),
  potionRed: require("../assets/icons/icon-potion-red.webp"),
  potionBlue: require("../assets/icons/icon-potion-blue.webp"),
  compass: require("../assets/icons/icon-compass.webp"),
  star: require("../assets/icons/icon-star.webp"),
  // The star in black and white — a stage challenge not yet earned (map).
  starGray: require("../assets/icons/icon-star-gray.webp"),
  heart: require("../assets/icons/icon-heart.webp"),
  shop: require("../assets/icons/icon-shop.webp"),
  key: require("../assets/icons/icon-key.webp"),
  trophy: require("../assets/icons/icon-trophy.webp"),
  energy: require("../assets/icons/icon-energy.webp"),
  scroll: require("../assets/icons/icon-scroll.webp"),
  home: require("../assets/icons/icon-home.webp"),
  settings: require("../assets/icons/icon-settings.webp"),
  settingsGear: require("../assets/icons/icon-settings-gear.webp"),
  questMedal: require("../assets/icons/icon-quest-medal.webp"),
  codexBook: require("../assets/icons/icon-codex-book.webp"),
  codexMonster: require("../assets/icons/icon-codex-monster.webp"),
  codexIngredient: require("../assets/icons/icon-codex-ingredient.webp"),
};

// 재화 그림: one gem / one coin, then growing hauls (pile, small sack, big sack, cart) — for
// shop products and rewards whose size should read at a glance.
export const currencyImages = {
  gem: [
    require("../assets/currency/gem-1.webp"),
    require("../assets/currency/gem-2.webp"),
    require("../assets/currency/gem-3.webp"),
    require("../assets/currency/gem-4.webp"),
    require("../assets/currency/gem-5.webp"),
  ],
  gold: [
    require("../assets/currency/gold-1.webp"),
    require("../assets/currency/gold-2.webp"),
    require("../assets/currency/gold-3.webp"),
    require("../assets/currency/gold-4.webp"),
    require("../assets/currency/gold-5.webp"),
  ],
};

export const uiImages = {
  // 기니 상자: the paw-sealed gift box, shut and opened (glowing). Art is 360x333 / 357x360.
  guineaBox: require("../assets/ui/guinea-box.webp"),
  guineaBoxOpen: require("../assets/ui/guinea-box-open.webp"),
  coin: require("../assets/ui/coin.webp"),
  // 연구소: a fully researched node's crowned gold frame (built from panels/panel-25; the body below
  // the crown is square — 200px wide, crown on top makes it 221px tall).
  labNodeComplete: require("../assets/ui/lab-node-complete.webp"),
  // Winged coin that flutters across the battle scene to be tapped.
  coinWinged: require("../assets/ui/coin-winged.webp"),
  // Winged gem that occasionally replaces the flying coin in battle.
  gemWinged: require("../assets/ui/gem-winged.webp"),
  // Clapperboard with a play button: marks anything that plays an ad (AdBadge).
  adClapper: require("../assets/ui/ad-clapper.webp"),
  // Speech bubbles (tail bottom-left), 200 wide: yellow 200x172 (the first clear's ad offer),
  // plain cream 200x181, cream with a "!" 200x182.
  bubbleYellow: require("../assets/ui/bubble-yellow.webp"),
  bubbleBlank: require("../assets/ui/bubble-blank.webp"),
  bubbleAlert: require("../assets/ui/bubble-alert.webp"),
  // Glossy gold arrow, pointing right in the art; GuideArrow turns it to point where needed.
  guideArrow: require("../assets/ui/guide-arrow.webp"),
  coins: require("../assets/ui/item-coins.webp"),
  // The single faceted crystal (assets/currency/gem-1), taller than wide (~4:5) — square slots with resizeMode contain fit it.
  crystal: require("../assets/currency/gem-1.webp"),
  gear: require("../assets/ui/item-gear.webp"),
  badgeAlert: require("../assets/ui/badge-alert.webp"),
  carrot: require("../assets/ui/item-carrot.webp"),
};

// Skill icons, 256px wide; SKILL_ICON_ASPECT is each one's width / height.
export const skillImages = {
  beam: require("../assets/skills/beam.webp"),
  steal: require("../assets/skills/steal.webp"),
  focus: require("../assets/skills/focus.webp"),
  execute: require("../assets/skills/execute.webp"),
  shout: require("../assets/skills/shout.webp"),
  diligent: require("../assets/skills/diligent.webp"),
  glutton: require("../assets/skills/glutton.webp"),
  barrage: require("../assets/skills/barrage.webp"),
  teleport: require("../assets/skills/teleport.webp"),
  carrotThrow: require("../assets/skills/carrotThrow.webp"),
  chiliThrow: require("../assets/skills/chiliThrow.webp"),
  meteor: require("../assets/skills/meteor.webp"),
};
const SQUARE_ICON = 256 / 258;
export const SKILL_ICON_ASPECT: Record<keyof typeof skillImages, number> = {
  beam: 1,
  steal: 1,
  focus: 1,
  execute: 1,
  shout: 1,
  diligent: SQUARE_ICON,
  glutton: SQUARE_ICON,
  barrage: 1,
  teleport: 1,
  carrotThrow: 1,
  chiliThrow: 1,
  meteor: 1,
};

export const food = {
  cookPot: require("../assets/food/cook-pot.webp"),
  cookPotOutlined: require("../assets/food/cook-pot-outlined.webp"),
  cookPotTrim: require("../assets/food/cook-pot-trim.webp"),
  fryingPan: require("../assets/food/frying-pan.webp"),
  stewPot: require("../assets/food/stew-pot.webp"),
  cuttingBoard: require("../assets/food/cutting-board.webp"),
  kitchen: require("../assets/food/kitchen.webp"),
  carrot: require("../assets/food/carrot.webp"),
  tomato: require("../assets/food/tomato.webp"),
  potato: require("../assets/food/potato.webp"),
  mushroom: require("../assets/food/mushroom.webp"),
  cabbage: require("../assets/food/cabbage.webp"),
  pumpkin: require("../assets/food/pumpkin.webp"),
  corn: require("../assets/food/corn.webp"),
  onion: require("../assets/food/onion.webp"),
  egg: require("../assets/food/egg.webp"),
  milk: require("../assets/food/milk.webp"),
  cheese: require("../assets/food/cheese.webp"),
  chicken: require("../assets/food/chicken.webp"),
  porkBelly: require("../assets/food/pork-belly.webp"),
  beef: require("../assets/food/beef.webp"),
  lamb: require("../assets/food/lamb.webp"),
  salmon: require("../assets/food/salmon.webp"),
  // Grilled versions, saved for future grill recipes.
  chickenGrilled: require("../assets/food/chicken-grilled.webp"),
  porkBellyGrilled: require("../assets/food/pork-belly-grilled.webp"),
  beefGrilled: require("../assets/food/beef-grilled.webp"),
  lambGrilled: require("../assets/food/lamb-grilled.webp"),
  salmonGrilled: require("../assets/food/salmon-grilled.webp"),
  pudding: require("../assets/food/pudding.webp"),
  mushroomSoup: require("../assets/food/mushroom-soup.webp"),
  pumpkinRoast: require("../assets/food/pumpkin-roast.webp"),
  dishVeggieStew: require("../assets/food/dish-veggie-stew.webp"),
  dishSalad: require("../assets/food/dish-salad.webp"),
  dishBananaMilk: require("../assets/food/dish-banana-milk.webp"),
  dishPotatoPancake: require("../assets/food/dish-potato-pancake.webp"),
  dishSalmonSteak: require("../assets/food/dish-salmon-steak.webp"),
  dishSlimePotion: require("../assets/food/dish-slime-potion.webp"),
  dishYukhoe: require("../assets/food/dish-yukhoe.webp"),
  dishMusselSeaweedSoup: require("../assets/food/dish-mussel-seaweed-soup.webp"),
  dishSalmonSashimi: require("../assets/food/dish-salmon-sashimi.webp"),
  dishBarleyTea: require("../assets/food/dish-barley-tea.webp"),
  dishMangoSmoothie: require("../assets/food/dish-mango-smoothie.webp"),
  dishGrilledSardine: require("../assets/food/dish-grilled-sardine.webp"),
  dishSpicyOyster: require("../assets/food/dish-spicy-oyster.webp"),
  dishFiveGrainRice: require("../assets/food/dish-five-grain-rice.webp"),
  dishPatbingsu: require("../assets/food/dish-patbingsu.webp"),
  dishSalmonRoeBowl: require("../assets/food/dish-salmon-roe-bowl.webp"),
  dishTunaSashimi: require("../assets/food/dish-tuna-sashimi.webp"),
  dishOctopus: require("../assets/food/dish-octopus.webp"),
  dishShrimpSashimi: require("../assets/food/dish-shrimp-sashimi.webp"),
  dishGreenJelly: require("../assets/food/dish-green-jelly.webp"),
  dishRoyalJelly: require("../assets/food/dish-royal-jelly.webp"),
  dishSteak: require("../assets/food/dish-steak.webp"),
  dishSeafoodBoil: require("../assets/food/dish-seafood-boil.webp"),
  crab: require("../assets/food/crab.webp"),
  shrimp: require("../assets/food/shrimp.webp"),
  octopus: require("../assets/food/octopus.webp"),
  squid: require("../assets/food/squid.webp"),
  tuna: require("../assets/food/tuna.webp"),
  sardine: require("../assets/food/sardine.webp"),
  mussel: require("../assets/food/mussel.webp"),
  lobster: require("../assets/food/lobster.webp"),
  oyster: require("../assets/food/oyster.webp"),
  fishSteak: require("../assets/food/fish-steak.webp"),
  sharkFin: require("../assets/food/shark-fin.webp"),
  roe: require("../assets/food/roe.webp"),
  chili: require("../assets/food/chili.webp"),
  fireFruit: require("../assets/food/fire-fruit.webp"),
  seaweed: require("../assets/food/seaweed.webp"),
  greenJelly: require("../assets/food/green-jelly.webp"),
  herb: require("../assets/food/herb.webp"),
  dill: require("../assets/food/dill.webp"),
  // 이슬: the water of this world's cooking, shed by slimes.
  dew: require("../assets/food/dew.webp"),
  lemon: require("../assets/food/lemon.webp"),
  greenApple: require("../assets/food/green-apple.webp"),
  royalJelly: require("../assets/food/royal-jelly.webp"),
  salt: require("../assets/food/salt.webp"),
  crabMeat: require("../assets/food/crab-meat.webp"),
  banana: require("../assets/food/banana.webp"),
  mango: require("../assets/food/mango.webp"),
  coconut: require("../assets/food/coconut.webp"),
  bambooShoot: require("../assets/food/bamboo-shoot.webp"),
  dumplingWrapper: require("../assets/food/dumpling-wrapper.webp"),
  driedPersimmon: require("../assets/food/dried-persimmon.webp"),
  makgeolli: require("../assets/food/makgeolli.webp"),
  azalea: require("../assets/food/azalea.webp"),
  rice: require("../assets/food/rice.webp"),
  // Fruits.
  asianPear: require("../assets/food/asian-pear.webp"),
  peach: require("../assets/food/peach.webp"),
  persimmon: require("../assets/food/persimmon.webp"),
  kyohoGrapes: require("../assets/food/kyoho-grapes.webp"),
  shineMuscat: require("../assets/food/shine-muscat.webp"),
  mandarin: require("../assets/food/mandarin.webp"),
  nectarine: require("../assets/food/nectarine.webp"),
  jujube: require("../assets/food/jujube.webp"),
  ume: require("../assets/food/ume.webp"),
  apricot: require("../assets/food/apricot.webp"),
  kiwi: require("../assets/food/kiwi.webp"),
  pomegranate: require("../assets/food/pomegranate.webp"),
  koreanRaspberry: require("../assets/food/korean-raspberry.webp"),
  omija: require("../assets/food/omija.webp"),
  strawberry: require("../assets/food/strawberry.webp"),
  chamoe: require("../assets/food/chamoe.webp"),
  // Nuts.
  almond: require("../assets/food/almond.webp"),
  walnut: require("../assets/food/walnut.webp"),
  cashew: require("../assets/food/cashew.webp"),
  pistachio: require("../assets/food/pistachio.webp"),
  hazelnut: require("../assets/food/hazelnut.webp"),
  macadamia: require("../assets/food/macadamia.webp"),
  pecan: require("../assets/food/pecan.webp"),
  peanut: require("../assets/food/peanut.webp"),
  pineNut: require("../assets/food/pine-nut.webp"),
  chestnut: require("../assets/food/chestnut.webp"),
  ginkgo: require("../assets/food/ginkgo.webp"),
  brazilNut: require("../assets/food/brazil-nut.webp"),
  // Grains and beans.
  brownRice: require("../assets/food/brown-rice.webp"),
  blackRice: require("../assets/food/black-rice.webp"),
  glutinousRice: require("../assets/food/glutinous-rice.webp"),
  barley: require("../assets/food/barley.webp"),
  oats: require("../assets/food/oats.webp"),
  foxtailMillet: require("../assets/food/foxtail-millet.webp"),
  sorghum: require("../assets/food/sorghum.webp"),
  redBeans: require("../assets/food/red-beans.webp"),
  blackBeans: require("../assets/food/black-beans.webp"),
  chiliPowder: require("../assets/food/chili-powder.webp"),
  mackerel: require("../assets/food/mackerel.webp"),
  squidInk: require("../assets/food/squid-ink.webp"),
  blossomPetals: require("../assets/food/blossom-petals.webp"),
  friedTofu: require("../assets/food/fried-tofu.webp"),
  radish: require("../assets/food/radish.webp"),
  yuzu: require("../assets/food/yuzu.webp"),
  abalone: require("../assets/food/abalone.webp"),
  dishBambooDumpling: require("../assets/food/dish-bamboo-dumpling.webp"),
  dishPersimmonRoll: require("../assets/food/dish-persimmon-roll.webp"),
  dishHaemulPajeon: require("../assets/food/dish-haemul-pajeon.webp"),
  dishAzaleaHwajeon: require("../assets/food/dish-azalea-hwajeon.webp"),
  dishTteokbokki: require("../assets/food/dish-tteokbokki.webp"),
  dishBraisedMackerel: require("../assets/food/dish-braised-mackerel.webp"),
  dishSquidInkRisotto: require("../assets/food/dish-squid-ink-risotto.webp"),
  dishSakuraMochi: require("../assets/food/dish-sakura-mochi.webp"),
  dishInariSushi: require("../assets/food/dish-inari-sushi.webp"),
  dishYuzuSherbet: require("../assets/food/dish-yuzu-sherbet.webp"),
  dishAbalonePorridge: require("../assets/food/dish-abalone-porridge.webp"),
  dishDragonFeast: require("../assets/food/dish-dragon-feast.webp"),
  curryPowder: require("../assets/food/curry-powder.webp"),
  goldenTurmeric: require("../assets/food/golden-turmeric.webp"),
  dishCurryRice: require("../assets/food/dish-curry-rice.webp"),
  teaLeaf: require("../assets/food/tea-leaf.webp"),
  yakMilk: require("../assets/food/yak-milk.webp"),
  dishMasalaChai: require("../assets/food/dish-masala-chai.webp"),
  saffron: require("../assets/food/saffron.webp"),
  basmatiRice: require("../assets/food/basmati-rice.webp"),
  dishMughalBiryani: require("../assets/food/dish-mughal-biryani.webp"),
  lemongrass: require("../assets/food/lemongrass.webp"),
  lime: require("../assets/food/lime.webp"),
  dishTomYumGoong: require("../assets/food/dish-tom-yum-goong.webp"),
  palmSugar: require("../assets/food/palm-sugar.webp"),
  sambal: require("../assets/food/sambal.webp"),
  dishNasiGoreng: require("../assets/food/dish-nasi-goreng.webp"),
  pineapple: require("../assets/food/pineapple.webp"),
  dishPokeBowl: require("../assets/food/dish-poke-bowl.webp"),
  bbqSauce: require("../assets/food/bbq-sauce.webp"),
  dishPecanBbqRibs: require("../assets/food/dish-pecan-bbq-ribs.webp"),
  avocado: require("../assets/food/avocado.webp"),
  tortilla: require("../assets/food/tortilla.webp"),
  dishStreetTacos: require("../assets/food/dish-street-tacos.webp"),
  cacao: require("../assets/food/cacao.webp"),
  dishChocoBanana: require("../assets/food/dish-choco-banana.webp"),
  dishChileanEmpanada: require("../assets/food/dish-chilean-empanada.webp"),
  quinoa: require("../assets/food/quinoa.webp"),
  sunGoldenPotato: require("../assets/food/sun-golden-potato.webp"),
  dishGoldenSunSoup: require("../assets/food/dish-golden-sun-soup.webp"),
};

// A stretchable UI frame: `insets` (source px: top, right, bottom, left) mark the rounded
// corners/outline that NineSlice keeps unscaled while the plain middle stretches.
// `centerColor` replaces the stretched middle for frames that grow far past their art.
export type UiSlice = { source: number; width: number; height: number; insets: [number, number, number, number]; centerColor?: string };

const slice = (source: number, width: number, height: number, insets: UiSlice["insets"], centerColor?: string): UiSlice => ({
  source,
  width,
  height,
  insets,
  centerColor,
});

// Soft parchment-and-pill kit. Shared by the growth panel, buttons, cards and modals on
// every page — swapping art here reskins all of them.
export const kit = {
  panelLarge: slice(require("../assets/kit2/panel-xl.webp"), 421, 145, [26, 26, 28, 26], "#fde7b5"),
  panel: slice(require("../assets/kit2/card.webp"), 176, 97, [24, 24, 26, 24], "#fcebca"),
  panelSmall: slice(require("../assets/kit2/panel-square.webp"), 133, 151, [26, 26, 28, 26], "#fdefce"),
  panelBrown: slice(require("../assets/kit2/plank.webp"), 179, 59, [18, 24, 20, 24], "#d9a56b"),
  panelParchment: slice(require("../assets/kit2/panel-tall.webp"), 117, 153, [26, 26, 28, 26], "#fdeabb"),
  inset: slice(require("../assets/kit2/cushion.webp"), 157, 66, [22, 24, 24, 24], "#fde8b9"),
  slot: slice(require("../assets/kit2/sq-cream.webp"), 54, 56, [16, 16, 18, 16], "#fceccb"),
  buttonCream: slice(require("../assets/kit2/btn-cream.webp"), 147, 48, [16, 22, 18, 22]),
  buttonGreen: slice(require("../assets/kit2/btn-green.webp"), 145, 49, [16, 22, 18, 22]),
  buttonBeige: slice(require("../assets/kit2/btn-tan-2.webp"), 145, 48, [16, 22, 18, 22]),
  buttonGray: slice(require("../assets/kit2/btn-gray.webp"), 134, 47, [16, 22, 18, 22]),
  buttonBrown: slice(require("../assets/kit2/plank.webp"), 179, 59, [18, 24, 20, 24]),
  buttonGold: slice(require("../assets/kit2/btn-gold.webp"), 146, 49, [16, 22, 18, 22]),
  tabGreen: slice(require("../assets/kit2/green-panel.webp"), 204, 95, [26, 28, 30, 28], "#81bd3b"),
  track: slice(require("../assets/ui/kit-track.webp"), 362, 47, [20, 24, 20, 24], "#fcf2d8"),
};

// Grandma's grocery: warmer wood-and-linen frames from the shop sheet.
export const shopKit = {
  cardWood: slice(require("../assets/shop/card-wood.webp"), 184, 253, [36, 36, 40, 36], "#fef1d2"),
  frameWide: slice(require("../assets/shop/frame-wide.webp"), 598, 237, [70, 60, 70, 70], "#faedd1"),
  // Tail hangs off the bottom-left, so those insets are wide enough to keep it whole.
  bubble: slice(require("../assets/shop/bubble.webp"), 347, 206, [40, 40, 60, 80], "#fdf4d9"),
  // Coin is baked into the left end.
  coinPill: slice(require("../assets/shop/coin-pill.webp"), 331, 104, [30, 50, 36, 100]),
  pillRed: slice(require("../assets/shop/pill-red.webp"), 225, 74, [30, 40, 34, 40]),
  pillCream: slice(require("../assets/shop/pill-cream.webp"), 225, 72, [30, 40, 34, 40]),
  pillGray: slice(require("../assets/shop/pill-gray.webp"), 188, 74, [30, 40, 34, 40]),
};

export const shopImages = {
  background: require("../assets/shop/background.jpg"),
  tabCream: require("../assets/shop/tab-cream.webp"),
  tabRed: require("../assets/shop/tab-red.webp"),
  arrowBack: require("../assets/shop/arrow-back.webp"),
  arrowBackGray: require("../assets/shop/arrow-back-gray.webp"),
};

export const chef = {
  spoon: require("../assets/npc/chef-spoon.webp"),
  cheer: require("../assets/npc/chef-cheer.webp"),
  serve: require("../assets/npc/chef-serve.webp"),
  book: require("../assets/npc/chef-book.webp"),
  wok: require("../assets/npc/chef-wok.webp"),
};

// Blank recipe scrolls/books. A recipe's card is one of these plus its dish drawn on top,
// so a new recipe never needs its own art.
export const recipeTemplates = {
  scrollPlain: require("../assets/recipe-templates/scroll-plain.webp"),
  scrollRibbonCrown: require("../assets/recipe-templates/scroll-ribbon-crown.webp"),
  bookRed: require("../assets/recipe-templates/book-red.webp"),
  bookBlueStar: require("../assets/recipe-templates/book-blue-star.webp"),
  bookBrown: require("../assets/recipe-templates/book-brown.webp"),
  scrollSealedGold: require("../assets/recipe-templates/scroll-sealed-gold.webp"),
};

export const grandma = {
  happy: require("../assets/npc/grandma-happy.webp"),
  wave: require("../assets/npc/grandma-wave.webp"),
  basket: require("../assets/npc/grandma-basket.webp"),
  menu: require("../assets/npc/grandma-menu.webp"),
  counter: require("../assets/npc/grandma-counter.webp"),
};

// 일일 의뢰 scene: the restaurant hall (1008x564) and the order counter in front of it
// (900x398, transparent; its wooden top's front edge sits ~36% down, props stand above).
export const dailyImages = {
  restaurant: require("../assets/daily/restaurant.webp"),
  counter: require("../assets/daily/counter.webp"),
  // Caramel wallpaper with chef hats and forks (780x1386), under the counter.
  pattern: require("../assets/daily/pattern.webp"),
  // Gold frame for the order tickets (300x328, transparent inside).
  ticketFrame: require("../assets/daily/ticket-frame.webp"),
  ticketFrameCompanion: require("../assets/daily/ticket-frame-companion.webp"),
};

// 일일 의뢰 customers (state/daily.ts CUSTOMERS), all 320 tall: lady 307, farmer 297,
// scholar 288, noble 313, gentleman 285, auntie 297 wide.
export const npcImages = {
  customerLady: require("../assets/npc/customer-lady.webp"),
  customerFarmer: require("../assets/npc/customer-farmer.webp"),
  customerScholar: require("../assets/npc/customer-scholar.webp"),
  customerNoble: require("../assets/npc/customer-noble.webp"),
  customerGentleman: require("../assets/npc/customer-gentleman.webp"),
  customerAuntie: require("../assets/npc/customer-auntie.webp"),
  customerGirl: require("../assets/npc/customer-girl.webp"),
};

export const statIcons = {
  attack: require("../assets/stats/attack.webp"),
  criticalDamage: require("../assets/stats/critical-damage.webp"),
  criticalChance: require("../assets/stats/critical-chance.webp"),
  goldBonus: require("../assets/stats/gold.webp"),
  // Same icon as every other attack-speed reference in the game (CompanionsScreen's
  // EFFECT_ICONS) — no dedicated stats/ art for it.
  attackSpeed: icons.energy,
};

// Rounded green/cream button set.
export const buttonKit = {
  pillCream: slice(require("../assets/buttons/pill-cream.webp"), 255, 94, [36, 46, 40, 46]),
};

export const buttonImages = {
  plusGreen: require("../assets/buttons/plus-green.webp"),
  // Round red X — a popup's close button, pinned to its top-right corner.
  closeRed: require("../assets/buttons/close-red.webp"),
};

export const navIcons = {
  battle: require("../assets/nav/battle.webp"),
  companions: require("../assets/nav/companions.webp"),
  skills: require("../assets/nav/skills.webp"),
  shop: require("../assets/nav/shop.webp"),
};

// Wood-and-brass frames: bars, slots, rings and emblems.
export const frameKit = {
  barFrame: slice(require("../assets/frames/bar-frame.webp"), 495, 40, [10, 22, 10, 22], "#fde4b8"),
  fillGold: slice(require("../assets/frames/fill-gold.webp"), 275, 36, [14, 18, 14, 18]),
  fillGreen: slice(require("../assets/frames/fill-green.webp"), 277, 36, [14, 18, 14, 18]),
  fillRed: slice(require("../assets/frames/fill-red.webp"), 275, 34, [14, 18, 14, 18]),
  fillBlue: slice(require("../assets/frames/fill-blue.webp"), 276, 36, [14, 18, 14, 18]),
  squareWood: slice(require("../assets/kit2/sq-cream.webp"), 54, 56, [16, 16, 18, 16], "#fceccb"),
  // Plain wood square from the frames-wood sheet (wood-1-3) — 연구소's nodes before their first step.
  woodSquare: slice(require("../assets/frames-wood/wood-1-3.webp"), 203, 196, [46, 46, 46, 46], "#fce9c4"),
  squareGold: slice(require("../assets/kit2/frame-gold.webp"), 134, 153, [24, 24, 24, 24], "#fdf0d3"),
};

export const frameImages = {
  slotPlus: require("../assets/frames/slot-wood-plus.webp"),
  // Gold rim for the skill slot, so it reads apart from the wood food slots beside it.
  slotPlusGold: require("../assets/frames/slot-gold-plus.webp"),
  ringWood: require("../assets/frames/ring-wood.webp"),
  ringGold: require("../assets/frames/ring-gold.webp"),
};

export const headerKit = {
  nameTag: slice(require("../assets/kit2/scroll-tag.webp"), 147, 55, [14, 26, 16, 26], "#fae3bd"),
  // One cream card holding the whole profile (avatar, name, level, exp).
  // Wood-rimmed pill with a round socket on the left that the avatar sits in.
  profile: slice(require("../assets/kit2/pill-coin.webp"), 232, 68, [20, 34, 22, 66], "#fcebc8"),
};

export const kitImages = {
  toggleOn: require("../assets/ui/kit-toggle-on.webp"),
  toggleOff: require("../assets/ui/kit-toggle-off.webp"),
  dotRed: require("../assets/ui/kit-dot-red.webp"),
};

// Kenney.nl CC0 sound effects (public domain, no attribution required) — see
// assets/sfx/SOURCES.md for which pack and original file each one came from.
export const sfx = {
  hit: require("../assets/sfx/hit.wav"),
  crit: require("../assets/sfx/crit.wav"),
  levelup: require("../assets/sfx/levelup.wav"),
  bossEnter: require("../assets/sfx/boss_enter.wav"),
  uiClick: require("../assets/sfx/ui_click.wav"),
  uiToggle: require("../assets/sfx/ui_toggle.wav"),
  cookStart: require("../assets/sfx/cook_start.wav"),
  cookDone: require("../assets/sfx/cook_done.wav"),
};

// Looping background tracks — "Counter-Rhythms" by Buant for the field, "8-bit 보스전" while a boss is up.
// Story comic panels (see state/comics.ts for their speech bubbles).
export const comics = {
  opening1: require("../assets/comics/opening-1.webp"),
  opening2: require("../assets/comics/opening-2.webp"),
  opening3: require("../assets/comics/opening-3.webp"),
  opening4: require("../assets/comics/opening-4.webp"),
  cookbook1: require("../assets/comics/cookbook-1.webp"),
  cookbook2: require("../assets/comics/cookbook-2.webp"),
  cookbook3: require("../assets/comics/cookbook-3.webp"),
  cookbook4: require("../assets/comics/cookbook-4.webp"),
  explorer1: require("../assets/comics/explorer-1.webp"),
  explorer2: require("../assets/comics/explorer-2.webp"),
  explorer3: require("../assets/comics/explorer-3.webp"),
  explorer4: require("../assets/comics/explorer-4.webp"),
  teto1: require("../assets/comics/teto-1.webp"),
  teto2: require("../assets/comics/teto-2.webp"),
  teto3: require("../assets/comics/teto-3.webp"),
  teto4: require("../assets/comics/teto-4.webp"),
  assassin1: require("../assets/comics/assassin-1.webp"),
  assassin2: require("../assets/comics/assassin-2.webp"),
  assassin3: require("../assets/comics/assassin-3.webp"),
  assassin4: require("../assets/comics/assassin-4.webp"),
  egen1: require("../assets/comics/egen-1.webp"),
  egen2: require("../assets/comics/egen-2.webp"),
  egen3: require("../assets/comics/egen-3.webp"),
  egen4: require("../assets/comics/egen-4.webp"),
  samurai1: require("../assets/comics/samurai-1.webp"),
  samurai2: require("../assets/comics/samurai-2.webp"),
  samurai3: require("../assets/comics/samurai-3.webp"),
  samurai4: require("../assets/comics/samurai-4.webp"),
  harbor1: require("../assets/comics/harbor-1.webp"),
  harbor2: require("../assets/comics/harbor-2.webp"),
  harbor3: require("../assets/comics/harbor-3.webp"),
  harbor4: require("../assets/comics/harbor-4.webp"),
  dive1: require("../assets/comics/dive-1.webp"),
  dive2: require("../assets/comics/dive-2.webp"),
  dive3: require("../assets/comics/dive-3.webp"),
  dive4: require("../assets/comics/dive-4.webp"),
  kite1: require("../assets/comics/kite-1.webp"),
  kite2: require("../assets/comics/kite-2.webp"),
  kite3: require("../assets/comics/kite-3.webp"),
  kite4: require("../assets/comics/kite-4.webp"),
  snowpass1: require("../assets/comics/snowpass-1.webp"),
  snowpass2: require("../assets/comics/snowpass-2.webp"),
  snowpass3: require("../assets/comics/snowpass-3.webp"),
  snowpass4: require("../assets/comics/snowpass-4.webp"),
  jungle1: require("../assets/comics/jungle-1.webp"),
  jungle2: require("../assets/comics/jungle-2.webp"),
  jungle3: require("../assets/comics/jungle-3.webp"),
  jungle4: require("../assets/comics/jungle-4.webp"),
  cavevillage1: require("../assets/comics/cavevillage-1.webp"),
  cavevillage2: require("../assets/comics/cavevillage-2.webp"),
  cavevillage3: require("../assets/comics/cavevillage-3.webp"),
  cavevillage4: require("../assets/comics/cavevillage-4.webp"),
  cloudpalace1: require("../assets/comics/cloudpalace-1.webp"),
  cloudpalace2: require("../assets/comics/cloudpalace-2.webp"),
  cloudpalace3: require("../assets/comics/cloudpalace-3.webp"),
  cloudpalace4: require("../assets/comics/cloudpalace-4.webp"),
  farmchicken1: require("../assets/comics/farmchicken-1.webp"),
  farmchicken2: require("../assets/comics/farmchicken-2.webp"),
  farmchicken3: require("../assets/comics/farmchicken-3.webp"),
  farmchicken4: require("../assets/comics/farmchicken-4.webp"),
  jungleoasis1: require("../assets/comics/jungleoasis-1.webp"),
  jungleoasis2: require("../assets/comics/jungleoasis-2.webp"),
  jungleoasis3: require("../assets/comics/jungleoasis-3.webp"),
  jungleoasis4: require("../assets/comics/jungleoasis-4.webp"),
  marketsilk1: require("../assets/comics/marketsilk-1.webp"),
  marketsilk2: require("../assets/comics/marketsilk-2.webp"),
  marketsilk3: require("../assets/comics/marketsilk-3.webp"),
  marketsilk4: require("../assets/comics/marketsilk-4.webp"),
  oasisdesert1: require("../assets/comics/oasisdesert-1.webp"),
  oasisdesert2: require("../assets/comics/oasisdesert-2.webp"),
  oasisdesert3: require("../assets/comics/oasisdesert-3.webp"),
  oasisdesert4: require("../assets/comics/oasisdesert-4.webp"),
  slimeroad1: require("../assets/comics/slimeroad-1.webp"),
  slimeroad2: require("../assets/comics/slimeroad-2.webp"),
  slimeroad3: require("../assets/comics/slimeroad-3.webp"),
  slimeroad4: require("../assets/comics/slimeroad-4.webp"),
  swampfarm1: require("../assets/comics/swampfarm-1.webp"),
  swampfarm2: require("../assets/comics/swampfarm-2.webp"),
  swampfarm3: require("../assets/comics/swampfarm-3.webp"),
  swampfarm4: require("../assets/comics/swampfarm-4.webp"),
  snowvillage1: require("../assets/comics/snowvillage-1.webp"),
  snowvillage2: require("../assets/comics/snowvillage-2.webp"),
  snowvillage3: require("../assets/comics/snowvillage-3.webp"),
  snowvillage4: require("../assets/comics/snowvillage-4.webp"),
  tigerride1: require("../assets/comics/tigerride-1.webp"),
  tigerride2: require("../assets/comics/tigerride-2.webp"),
  tigerride3: require("../assets/comics/tigerride-3.webp"),
  tigerride4: require("../assets/comics/tigerride-4.webp"),
  foxpath1: require("../assets/comics/foxpath-1.webp"),
  foxpath2: require("../assets/comics/foxpath-2.webp"),
  foxpath3: require("../assets/comics/foxpath-3.webp"),
  foxpath4: require("../assets/comics/foxpath-4.webp"),
  chiliport1: require("../assets/comics/chiliport-1.webp"),
  chiliport2: require("../assets/comics/chiliport-2.webp"),
  chiliport3: require("../assets/comics/chiliport-3.webp"),
  chiliport4: require("../assets/comics/chiliport-4.webp"),
  shrinesteps1: require("../assets/comics/shrinesteps-1.webp"),
  shrinesteps2: require("../assets/comics/shrinesteps-2.webp"),
  shrinesteps3: require("../assets/comics/shrinesteps-3.webp"),
  shrinesteps4: require("../assets/comics/shrinesteps-4.webp"),
  tanukimap1: require("../assets/comics/tanukimap-1.webp"),
  tanukimap2: require("../assets/comics/tanukimap-2.webp"),
  tanukimap3: require("../assets/comics/tanukimap-3.webp"),
  tanukimap4: require("../assets/comics/tanukimap-4.webp"),
  castleonsen1: require("../assets/comics/castleonsen-1.webp"),
  castleonsen2: require("../assets/comics/castleonsen-2.webp"),
  castleonsen3: require("../assets/comics/castleonsen-3.webp"),
  castleonsen4: require("../assets/comics/castleonsen-4.webp"),
  nightthief1: require("../assets/comics/nightthief-1.webp"),
  nightthief2: require("../assets/comics/nightthief-2.webp"),
  nightthief3: require("../assets/comics/nightthief-3.webp"),
  nightthief4: require("../assets/comics/nightthief-4.webp"),
  dragonroad1: require("../assets/comics/dragonroad-1.webp"),
  dragonroad2: require("../assets/comics/dragonroad-2.webp"),
  dragonroad3: require("../assets/comics/dragonroad-3.webp"),
  dragonroad4: require("../assets/comics/dragonroad-4.webp"),
  dragongate1: require("../assets/comics/dragongate-1.webp"),
  dragongate2: require("../assets/comics/dragongate-2.webp"),
  dragongate3: require("../assets/comics/dragongate-3.webp"),
  dragongate4: require("../assets/comics/dragongate-4.webp"),
  whaleride1: require("../assets/comics/whaleride-1.webp"),
  whaleride2: require("../assets/comics/whaleride-2.webp"),
  whaleride3: require("../assets/comics/whaleride-3.webp"),
  whaleride4: require("../assets/comics/whaleride-4.webp"),
  alpinetrain1: require("../assets/comics/alpinetrain-1.webp"),
  alpinetrain2: require("../assets/comics/alpinetrain-2.webp"),
  alpinetrain3: require("../assets/comics/alpinetrain-3.webp"),
  alpinetrain4: require("../assets/comics/alpinetrain-4.webp"),
  sledbakery1: require("../assets/comics/sledbakery-1.webp"),
  sledbakery2: require("../assets/comics/sledbakery-2.webp"),
  sledbakery3: require("../assets/comics/sledbakery-3.webp"),
  sledbakery4: require("../assets/comics/sledbakery-4.webp"),
  townasleep1: require("../assets/comics/townasleep-1.webp"),
  townasleep2: require("../assets/comics/townasleep-2.webp"),
  townasleep3: require("../assets/comics/townasleep-3.webp"),
  townasleep4: require("../assets/comics/townasleep-4.webp"),
  ginitown1: require("../assets/comics/ginitown-1.webp"),
  ginitown2: require("../assets/comics/ginitown-2.webp"),
  ginitown3: require("../assets/comics/ginitown-3.webp"),
  ginitown4: require("../assets/comics/ginitown-4.webp"),
  pumpkinforest1: require("../assets/comics/pumpkinforest-1.webp"),
  pumpkinforest2: require("../assets/comics/pumpkinforest-2.webp"),
  pumpkinforest3: require("../assets/comics/pumpkinforest-3.webp"),
  pumpkinforest4: require("../assets/comics/pumpkinforest-4.webp"),
  beeChase1: require("../assets/comics/bee-chase-1.webp"),
  beeChase2: require("../assets/comics/bee-chase-2.webp"),
  beeChase3: require("../assets/comics/bee-chase-3.webp"),
  beeChase4: require("../assets/comics/bee-chase-4.webp"),
  giniReturn1: require("../assets/comics/gini-return-1.webp"),
  giniReturn2: require("../assets/comics/gini-return-2.webp"),
  giniReturn3: require("../assets/comics/gini-return-3.webp"),
  giniReturn4: require("../assets/comics/gini-return-4.webp"),
  griffinFlight1: require("../assets/comics/griffin-flight-1.webp"),
  griffinFlight2: require("../assets/comics/griffin-flight-2.webp"),
  griffinFlight3: require("../assets/comics/griffin-flight-3.webp"),
  griffinFlight4: require("../assets/comics/griffin-flight-4.webp"),
  ending1: require("../assets/comics/ending-1.webp"),
  ending2: require("../assets/comics/ending-2.webp"),
  ending3: require("../assets/comics/ending-3.webp"),
  ending4: require("../assets/comics/ending-4.webp"),
  apprenticeGini1: require("../assets/comics/apprentice-gini-1.webp"),
  apprenticeGini2: require("../assets/comics/apprentice-gini-2.webp"),
  apprenticeGini3: require("../assets/comics/apprentice-gini-3.webp"),
  apprenticeGini4: require("../assets/comics/apprentice-gini-4.webp"),
  apprenticeGuard1: require("../assets/comics/apprentice-guard-1.webp"),
  apprenticeGuard2: require("../assets/comics/apprentice-guard-2.webp"),
  apprenticeGuard3: require("../assets/comics/apprentice-guard-3.webp"),
  apprenticeGuard4: require("../assets/comics/apprentice-guard-4.webp"),
  boxerEvolution1: require("../assets/comics/boxer-evolution-1.webp"),
  boxerEvolution2: require("../assets/comics/boxer-evolution-2.webp"),
  boxerEvolution3: require("../assets/comics/boxer-evolution-3.webp"),
  boxerEvolution4: require("../assets/comics/boxer-evolution-4.webp"),
  cowboyEvolution1: require("../assets/comics/cowboy-evolution-1.webp"),
  cowboyEvolution2: require("../assets/comics/cowboy-evolution-2.webp"),
  cowboyEvolution3: require("../assets/comics/cowboy-evolution-3.webp"),
  cowboyEvolution4: require("../assets/comics/cowboy-evolution-4.webp"),
  apprenticeMisfire1: require("../assets/comics/apprentice-misfire-1.webp"),
  apprenticeMisfire2: require("../assets/comics/apprentice-misfire-2.webp"),
  apprenticeMisfire3: require("../assets/comics/apprentice-misfire-3.webp"),
  apprenticeMisfire4: require("../assets/comics/apprentice-misfire-4.webp"),
  apprenticeQuickdraw1: require("../assets/comics/apprentice-quickdraw-1.webp"),
  apprenticeQuickdraw2: require("../assets/comics/apprentice-quickdraw-2.webp"),
  apprenticeQuickdraw3: require("../assets/comics/apprentice-quickdraw-3.webp"),
  apprenticeQuickdraw4: require("../assets/comics/apprentice-quickdraw-4.webp"),
  apprenticeWeak1: require("../assets/comics/apprentice-weak-1.webp"),
  apprenticeWeak2: require("../assets/comics/apprentice-weak-2.webp"),
  apprenticeWeak3: require("../assets/comics/apprentice-weak-3.webp"),
  apprenticeWeak4: require("../assets/comics/apprentice-weak-4.webp"),
  bazaarBound1: require("../assets/comics/bazaar-bound-1.webp"),
  bazaarBound2: require("../assets/comics/bazaar-bound-2.webp"),
  bazaarBound3: require("../assets/comics/bazaar-bound-3.webp"),
  bazaarBound4: require("../assets/comics/bazaar-bound-4.webp"),
  teaTrail1: require("../assets/comics/tea-trail-1.webp"),
  teaTrail2: require("../assets/comics/tea-trail-2.webp"),
  teaTrail3: require("../assets/comics/tea-trail-3.webp"),
  teaTrail4: require("../assets/comics/tea-trail-4.webp"),
  saffronGarden1: require("../assets/comics/saffron-garden-1.webp"),
  saffronGarden2: require("../assets/comics/saffron-garden-2.webp"),
  saffronGarden3: require("../assets/comics/saffron-garden-3.webp"),
  saffronGarden4: require("../assets/comics/saffron-garden-4.webp"),
  floatingMarket1: require("../assets/comics/floating-market-1.webp"),
  floatingMarket2: require("../assets/comics/floating-market-2.webp"),
  floatingMarket3: require("../assets/comics/floating-market-3.webp"),
  floatingMarket4: require("../assets/comics/floating-market-4.webp"),
  baliTerraces1: require("../assets/comics/bali-terraces-1.webp"),
  baliTerraces2: require("../assets/comics/bali-terraces-2.webp"),
  baliTerraces3: require("../assets/comics/bali-terraces-3.webp"),
  baliTerraces4: require("../assets/comics/bali-terraces-4.webp"),
  hawaiiBeach1: require("../assets/comics/hawaii-beach-1.webp"),
  hawaiiBeach2: require("../assets/comics/hawaii-beach-2.webp"),
  hawaiiBeach3: require("../assets/comics/hawaii-beach-3.webp"),
  hawaiiBeach4: require("../assets/comics/hawaii-beach-4.webp"),
  texasCanyon1: require("../assets/comics/texas-canyon-1.webp"),
  texasCanyon2: require("../assets/comics/texas-canyon-2.webp"),
  texasCanyon3: require("../assets/comics/texas-canyon-3.webp"),
  texasCanyon4: require("../assets/comics/texas-canyon-4.webp"),
  tacoFiesta1: require("../assets/comics/taco-fiesta-1.webp"),
  tacoFiesta2: require("../assets/comics/taco-fiesta-2.webp"),
  tacoFiesta3: require("../assets/comics/taco-fiesta-3.webp"),
  tacoFiesta4: require("../assets/comics/taco-fiesta-4.webp"),
  cacaoJungle1: require("../assets/comics/cacao-jungle-1.webp"),
  cacaoJungle2: require("../assets/comics/cacao-jungle-2.webp"),
  cacaoJungle3: require("../assets/comics/cacao-jungle-3.webp"),
  cacaoJungle4: require("../assets/comics/cacao-jungle-4.webp"),
  andesVineyard1: require("../assets/comics/andes-vineyard-1.webp"),
  andesVineyard2: require("../assets/comics/andes-vineyard-2.webp"),
  andesVineyard3: require("../assets/comics/andes-vineyard-3.webp"),
  andesVineyard4: require("../assets/comics/andes-vineyard-4.webp"),
  skyCity1: require("../assets/comics/sky-city-1.webp"),
  skyCity2: require("../assets/comics/sky-city-2.webp"),
  skyCity3: require("../assets/comics/sky-city-3.webp"),
  skyCity4: require("../assets/comics/sky-city-4.webp"),
  giniBoxRescue1: require("../assets/comics/gini-box-rescue-1.webp"),
  giniBoxRescue2: require("../assets/comics/gini-box-rescue-2.webp"),
  giniBoxRescue3: require("../assets/comics/gini-box-rescue-3.webp"),
  giniBoxRescue4: require("../assets/comics/gini-box-rescue-4.webp"),
};

// Per-region BGM — see BGM_GROUP in stages.ts for which EnemyKind maps to which group.
// Not every group has tracks yet; sound.ts falls back to "countryside" for the rest.
export const bgm = {
  countryside: {
    field: require("../assets/bgm/field-countryside.mp3"),
    boss: require("../assets/bgm/boss-countryside.mp3"),
  },
  tropical: {
    field: require("../assets/bgm/field-tropical.mp3"),
    boss: require("../assets/bgm/boss-tropical.mp3"),
  },
  desert: {
    field: require("../assets/bgm/field-desert.mp3"),
    boss: require("../assets/bgm/boss-desert.mp3"),
  },
  china: {
    field: require("../assets/bgm/field-china.mp3"),
    boss: require("../assets/bgm/boss-china.mp3"),
  },
  korea: {
    field: require("../assets/bgm/field-korea.mp3"),
    boss: require("../assets/bgm/boss-korea.mp3"),
  },
  japan: {
    field: require("../assets/bgm/field-japan.mp3"),
    boss: require("../assets/bgm/boss-japan.mp3"),
  },
  dragonPalace: {
    field: require("../assets/bgm/field-dragonPalace.mp3"),
    boss: require("../assets/bgm/boss-dragonPalace.mp3"),
  },
  europe: {
    field: require("../assets/bgm/field-europe.mp3"),
    boss: require("../assets/bgm/boss-europe.mp3"),
  },
  hauntedHouse: {
    field: require("../assets/bgm/field-hauntedHouse.mp3"),
    boss: require("../assets/bgm/boss-hauntedHouse.mp3"),
  },
  // Classic-fantasy road from 꿀향기 귀갓길 on (castles, a griffin, a dragon): "Curventure"
  // and "The Final Surge".
  fantasy: {
    field: require("../assets/bgm/field-fantasy.mp3"),
    boss: require("../assets/bgm/boss-fantasy.mp3"),
  },
  // 인도 향신료 바자르~타지마할 정원: "Sunny Adventure" and "Main Theme - Intense".
  india: {
    field: require("../assets/bgm/field-india.mp3"),
    boss: require("../assets/bgm/boss-india.mp3"),
  },
  // 바비큐 협곡: 아메리카 대륙 시작, 서부/컨트리 풍. "Campfire Quest" and "Hoedown of the Behemoth".
  country: {
    field: require("../assets/bgm/field-country.mp3"),
    boss: require("../assets/bgm/boss-country.mp3"),
  },
  // 타코 축제~태양의 공중도시: 라틴 풍. "Jungle to Vineyard" and "Sun-temple Conquest".
  latin: {
    field: require("../assets/bgm/field-latin.mp3"),
    boss: require("../assets/bgm/boss-latin.mp3"),
  },
};

// The title screen's own theme (마을 대기 화면), looping until the player taps in.
export const bgmTitle = require("../assets/bgm/title-village.mp3");

// Every strip frame is 160x160px, in a 5-frame row (guinea/slime) or 4-frame row (boss).
export const FRAME_SIZE = 160;

// Wood / gold / ribbon panel frames (sheet order, left→right, top→bottom). Drawn whole at
// their own aspect, or as 9-slices through panelSlices below.
export const panelArt = [
  require("../assets/panels/panel-00.webp"),
  require("../assets/panels/panel-01.webp"),
  require("../assets/panels/panel-02.webp"),
  require("../assets/panels/panel-03.webp"),
  require("../assets/panels/panel-04.webp"),
  require("../assets/panels/panel-05.webp"),
  require("../assets/panels/panel-06.webp"),
  require("../assets/panels/panel-07.webp"),
  require("../assets/panels/panel-08.webp"),
  require("../assets/panels/panel-09.webp"),
  require("../assets/panels/panel-10.webp"),
  require("../assets/panels/panel-11.webp"),
  require("../assets/panels/panel-12.webp"),
  require("../assets/panels/panel-13.webp"),
  require("../assets/panels/panel-14.webp"),
  require("../assets/panels/panel-15.webp"),
  require("../assets/panels/panel-16.webp"),
  require("../assets/panels/panel-18.webp"),
  require("../assets/panels/panel-19.webp"),
  require("../assets/panels/panel-20.webp"),
  require("../assets/panels/panel-21.webp"),
  require("../assets/panels/panel-22.webp"),
  require("../assets/panels/panel-23.webp"),
  require("../assets/panels/panel-24.webp"),
  require("../assets/panels/panel-25.webp"),
  require("../assets/panels/panel-26.webp"),
  require("../assets/panels/panel-27.webp"),
  require("../assets/panels/panel-28.webp"),
];

// Every modal's outer frame (see ModalFrame): the gold-trimmed parchment frame, and its
// diamond gem laid on top-centre separately so stretching the frame never stretches it.
export const modalKit = {
  // No flat centre fill: it reached up over the rail's inner lip (and the gem's lower half); the parchment art itself stretches fine.
  frame: slice(require("../assets/modal/modal-frame.webp"), 686, 326, [74, 64, 64, 64]),
  gem: require("../assets/modal/modal-gem.webp"),
  gemWidth: 98,
  gemHeight: 85,
};

// The ones used as stretchy frames, with insets that keep their corners and trim intact.
export const panelSlices = {
  // Big wood frame with brass bolts in each corner.
  // No flat centre colour: the art's own parchment stretches to fill, keeping its grain.
  // Insets take in the whole bolted corner blocks (~66px each way), so only the plain
  // straight rails between them stretch — the corners keep their shape at any height.
  woodBolts: slice(panelArt[0], 480, 212, [68, 68, 68, 68]),
  goldPill: slice(panelArt[16], 393, 109, [48, 52, 48, 52], "#fde4a6"),
  // Wood frame with a leafy plank sign across the top — the title goes on the plank.
  leafPlank: slice(panelArt[1], 480, 257, [106, 66, 42, 66]),
  // Wood frame with a red ribbon arching across the top — the heading goes on the ribbon.
  // Left/right insets meet in the middle so the ribbon never stretches sideways: draw it at
  // scale = width / 480; only the plain side posts stretch to fit taller content.
  redRibbon: slice(panelArt[13], 480, 205, [112, 240, 34, 240]),
  // Ornate boss-trophy frame (crown, crossed swords, wings up top; star medallion below).
  // Left/right insets meet in the middle so the ornaments never stretch sideways — draw it
  // at width = 1000 × scale; only the plain side posts stretch to fit taller content.
  bossTrophy: slice(require("../assets/panels/boss-frame.webp"), 1000, 749, [300, 499, 259, 499]),
};

// Soft cream inner panels (the second panel sheet): plain rounded plates for rows, chips and
// cells that sit inside a bigger frame. 0 big card, 3 square, 6 long pill, 7 speech bubble,
// 8 inset well, 9/14 gray (disabled), 10 dashed, 13/16/18/21 tan, 15/16 tall.
export const creamArt = [
  require("../assets/panels-cream/cream-00.webp"),
  require("../assets/panels-cream/cream-01.webp"),
  require("../assets/panels-cream/cream-02.webp"),
  require("../assets/panels-cream/cream-03.webp"),
  require("../assets/panels-cream/cream-04.webp"),
  require("../assets/panels-cream/cream-05.webp"),
  require("../assets/panels-cream/cream-06.webp"),
  require("../assets/panels-cream/cream-07.webp"),
  require("../assets/panels-cream/cream-08.webp"),
  require("../assets/panels-cream/cream-09.webp"),
  require("../assets/panels-cream/cream-10.webp"),
  require("../assets/panels-cream/cream-11.webp"),
  require("../assets/panels-cream/cream-12.webp"),
  require("../assets/panels-cream/cream-13.webp"),
  require("../assets/panels-cream/cream-14.webp"),
  require("../assets/panels-cream/cream-15.webp"),
  require("../assets/panels-cream/cream-16.webp"),
  require("../assets/panels-cream/cream-17.webp"),
  require("../assets/panels-cream/cream-18.webp"),
  require("../assets/panels-cream/cream-19.webp"),
  require("../assets/panels-cream/cream-20.webp"),
  require("../assets/panels-cream/cream-21.webp"),
];

export const creamSlices = {
  // A big card that groups several rows.
  card: slice(creamArt[0], 1114, 339, [96, 100, 100, 100], "#fdedc5"),
  // A full-width row plate.
  row: slice(creamArt[6], 1105, 139, [64, 72, 68, 72], "#fdeec8"),
  // A square cell for an item or icon.
  cell: slice(creamArt[3], 224, 217, [56, 58, 60, 58], "#feedc3"),
};

// 골목 상점: the merchant guinea (상인기니) and the gold-trimmed store frames from the shop
// sheets. Ornate (gem-studded) frames are the top tier, the simple gold ones the middle tier;
// small tiles inside them stay on creamSlices. The wide frames are sliced with left/right
// insets that meet in the middle so the top gem never stretches — draw them at
// scale = width / source width (see ShopScreen's StoreFrame).
export const merchantImages = {
  // The jewel-and-gold store interior behind the merchant (same 1168x880 as the kitchen).
  background: require("../assets/shop/store-background.webp"),
  wave: require("../assets/shop/merchant-wave.webp"),
  gem: require("../assets/shop/merchant-gem.webp"),
  gold: require("../assets/shop/merchant-gold.webp"),
  think: require("../assets/shop/merchant-think.webp"),
  bag: require("../assets/shop/merchant-bag.webp"),
  bust: require("../assets/shop/merchant-bust.webp"),
  mini: require("../assets/shop/merchant-mini.webp"),
};

export const storeArt = {
  ornateCurtain: require("../assets/shop/frame-ornate-curtain.webp"),
  ornatePill: require("../assets/shop/frame-ornate-pill.webp"),
  ornateMd: require("../assets/shop/frame-ornate-md.webp"),
  ornateSq: require("../assets/shop/frame-ornate-sq.webp"),
  ornateWide: require("../assets/shop/frame-ornate-wide.webp"),
  simpleMd: require("../assets/shop/frame-simple-md.webp"),
  simpleSq: require("../assets/shop/frame-simple-sq.webp"),
  simpleWide: require("../assets/shop/frame-simple-wide.webp"),
  simplePill: require("../assets/shop/frame-simple-pill.webp"),
  simpleCurtain: require("../assets/shop/frame-simple-curtain.webp"),
};

export const storeSlices = {
  // Gem crown on top, a gem on each side post and a gem leaf below — all kept unstretched.
  ornate: slice(require("../assets/shop/frame-ornate-lg.webp"), 558, 259, [178, 279, 60, 279], "#fcebc6"),
  // Plain gold-and-caramel frame, leaf sprigs in the corners.
  simple: slice(require("../assets/shop/frame-simple-lg.webp"), 600, 298, [130, 300, 100, 300], "#fcebc6"),
  // The brighter yellow-gold version of the same frame.
  simpleGold: slice(require("../assets/shop/frame-simple-gold.webp"), 577, 226, [115, 288, 85, 289], "#fcebc6"),
};

// 동료 조각: one badge, three colours by how far the companion has been promoted —
// orange to Lv.4, green from Lv.5 (first milestone), purple at Lv.10 (max).
export const shardImages = {
  orange: require("../assets/companions/shard-orange.webp"),
  green: require("../assets/companions/shard-green.webp"),
  purple: require("../assets/companions/shard-purple.webp"),
};

export function shardImageForLevel(level: number) {
  return level >= 10 ? shardImages.purple : level >= 5 ? shardImages.green : shardImages.orange;
}

// Each companion's own active skill icon (companionSkills.ts) — same square skill-card art
// style as skillImages above, one per outfit.
export const companionSkillImages: Record<Outfit, number> = {
  default: require("../assets/companions/skill-default.webp"),
  explorerHamster: require("../assets/companions/skill-explorer.webp"),
  tetoGini: require("../assets/companions/skill-teto.webp"),
  assassinGini: require("../assets/companions/skill-assassin.webp"),
  egenGini: require("../assets/companions/skill-egen.webp"),
  samuraiGini: require("../assets/companions/skill-samurai.webp"),
  chefGini: require("../assets/companions/skill-chef.webp"),
  witchGini: require("../assets/companions/skill-witch.webp"),
  cowboyGini: require("../assets/companions/skill-cowboy.webp"),
  boxerGini: require("../assets/companions/skill-boxer.webp"),
  // Its "skill" does nothing (companionSkills.ts) — reuses 모험기니's card rather than
  // drawing a new icon for an ability that has no actual effect to illustrate.
  transparentGini: require("../assets/companions/skill-default.webp"),
  // 기니상자 전용 동료들 — 능력 없음(전용 스킬도 추후 작업), 아이콘은 일단 재사용.
  nurseGini: require("../assets/companions/skill-default.webp"),
  archerGini: require("../assets/companions/skill-default.webp"),
  detectiveGini: require("../assets/companions/skill-default.webp"),
  plainGini: require("../assets/companions/skill-default.webp"),
  knightGini: require("../assets/companions/skill-default.webp"),
  sageGini: require("../assets/companions/skill-default.webp"),
};

// Wood frame sheet (frames-wood/, cut in reading order: row-column). Row 1 plain wood (wide,
// medium, square), green, stone; row 2 the same with a gold ornament on top; row 3 big wood,
// medium, small, green-filled, a thin gold-cornered bar; 4-1 a gold progress bar with a coin.
export const woodFrameArt = [
  require("../assets/frames-wood/wood-1-1.webp"),
  require("../assets/frames-wood/wood-1-2.webp"),
  require("../assets/frames-wood/wood-1-3.webp"),
  require("../assets/frames-wood/wood-1-4.webp"),
  require("../assets/frames-wood/wood-1-5.webp"),
  require("../assets/frames-wood/wood-2-1.webp"),
  require("../assets/frames-wood/wood-2-2.webp"),
  require("../assets/frames-wood/wood-2-3.webp"),
  require("../assets/frames-wood/wood-2-4.webp"),
  require("../assets/frames-wood/wood-2-5.webp"),
  require("../assets/frames-wood/wood-3-1.webp"),
  require("../assets/frames-wood/wood-3-2.webp"),
  require("../assets/frames-wood/wood-3-3.webp"),
  require("../assets/frames-wood/wood-3-4.webp"),
  require("../assets/frames-wood/wood-3-5.webp"),
  require("../assets/frames-wood/wood-4-1.webp"),
];
