function GenerateStats(character) {
  let srcTable = '<h3>Stats</h3><table class="table"><tbody>';

  let stats = character.data.stats;

  function addStat(name, val) {
    srcTable += `<tr><td>${name}</td><td>${val}</td><td>${Math.floor((val - 10) / 2)}</td></tr>`;
  }

  for (stat in stats) {
    addStat(stat, stats[stat]);
  }

  srcTable += '</tbody></table>';
  return srcTable;
}

function GenerateInventory(character) {
  let srcTable = '<h3>Inventory</h3><table class="table"><tbody>';

  let items = character.data.inventory;

  function addItem(name, desc, mods) {
    srcTable += `<tr><td>${name}</td><td>${desc}</td><td>${mods}</td></tr>`;
  }

  items.forEach(item => {
    addItem(item.name, item.desc, item.mods);
  });

  srcTable += '</tbody></table>';
  return srcTable;
}

function AddNode(src) {
  let newDiv = document.createElement('div');
  newDiv.innerHTML = src;
  document.body.appendChild(newDiv);
  return newDiv;
}

function SelectCharacter(character) {

  while (document.body.children.length) {
    document.body.removeChild(document.body.children[0]);
  }

  let nameNode = document.createElement('h3');
  nameNode.innerHTML = character.name;
  document.body.appendChild(nameNode);

  AddNode(GenerateStats(character));   
  AddNode(GenerateInventory(character));
  AddNode(`<h3>Racials</h3> ${character.data.racials}`);
  AddNode(`<h3>Languages</h3> ${character.data.languages}`);

  let bio = document.createElement('p');
  bio.innerHTML = character.data.bio;
  document.body.appendCHild(bio);
}

document.onreadystatechange = function() {
  SelectCharacter({
    name: 'Lawnmower',
    data: {
      stats: {
        'STR': 15,
        'CON': 13,
        'CHR': 13,
        'DEX': 13,
        'WIS': 11,
        'INT': 11
      },
      racials: "Dark Vision, Gnomish Cunning. Advantage Wisdom Int Charisma",
      languages: "All: Gnomish Reads: Dwarf",
      inventory: [ {name: "Mr Scissors", desc: "Glorious Scissors", mods: "1D6 1H 1D8 2H"} ]
    }
  });
}
