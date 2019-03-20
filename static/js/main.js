class CharacterPart { 
  constructor(obj) {
    this.core = obj;
    this._is_part = true; 
   for (let field in this.core) {
      if (typeof(this.core[field]) === "object" && this.core[field]._is_part) {
        this.core[field] = new CharacterPart(this.core[field]);
      }
    }
  }

  field(id, val) {
    if (typeof(val) === 'undefined') {
      return this.core[id];
    } else {
      this.core[id] = val;
    }
  }

  area(id) {
    if (!this.core[id]) {
      this.core[id] = new CharacterPart({});
    }
    return this.core[id];
  }
}
