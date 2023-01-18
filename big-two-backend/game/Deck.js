const Card = require('./Card');

class Deck {
    constructor() {
        this.cards = [];
    }

    createDeck() {
        const ranks = ['3', '4', '5', '6', '7', '8', '9', '10', 'J', 'Q', 'K', 'A', '2'];
        const suits = ['clubs', 'diamonds', 'hearts', 'spades'];
        for (const rank of ranks) {
            for (const suit of suits) {
                this.cards.push(new Card(rank, suit));
            }
        }
        // this.cards.push(new Card('black joker', null));
        // this.cards.push(new Card('red joker', null));
    }

    shuffle() {
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
    }

    deal(numCards) {
        const hand = [];
        for (let i = 0; i < numCards; i++) {
            hand.push(this.cards.pop());
        }
        return hand;
    }
}

module.exports = Deck;