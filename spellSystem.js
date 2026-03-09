// spellSystem.js

class Spell {
    constructor(name, basePower, element) {
        this.name = name;
        this.basePower = basePower;
        this.element = element;
    }

    evolve(newPower) {
        this.basePower += newPower;
    }

    mutate(newElement) {
        this.element = newElement;
    }

    interact(otherSpell) {
        if (this.element === 'Fire' && otherSpell.element === 'Ice') {
            return 'Steam'; // Fire + Ice = Steam
        } else if (this.element === 'Water' && otherSpell.element === 'Earth') {
            return 'Mud'; // Water + Earth = Mud
        }
        // Add more elemental interactions as needed
        return 'No interaction';
    }
}

class SpellGenerator {
    static generateSpell() {
        const spellNames = ['Fireball', 'Ice Shard', 'Lightning Bolt', 'Earth Shield'];
        const elements = ['Fire', 'Ice', 'Lightning', 'Earth', 'Water'];
        const name = spellNames[Math.floor(Math.random() * spellNames.length)];
        const power = Math.floor(Math.random() * 100) + 1; // Power between 1 and 100
        const element = elements[Math.floor(Math.random() * elements.length)];
        return new Spell(name, power, element);
    }
}

// Example usage:
const newSpell = SpellGenerator.generateSpell();
console.log(`Generated Spell: ${newSpell.name}, Power: ${newSpell.basePower}, Element: ${newSpell.element}`);
