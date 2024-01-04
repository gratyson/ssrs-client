
export const CORRECT_ANSWER_COLOR = "#48e577";
export const CORRECT_ANSWER_NEAR_MISS_COLOR = "#e1ee09";
export const INCORRECT_ANSWER_NEAR_MISS_COLOR = "#f1a91f";
export const INCORRECT_ANSWER_COLOR = "#fd3534";

const NOUN_CLASS = "background-color-accent-A400";
const VERB_CLASS = "background-color-accent-A200";
const ADJECTIVE_CLASS = "background-color-accent-A100";
const ADVERB_CLASS = "background-color-accent-A100";
const GRAMMAR_CLASS = "background-color-warn-200";
const ASPECT_CLASS = "background-color-warn-100";

export const ATTRIBUTE_CLASS_TABLE: { [k:string]: string } = {
    "n": NOUN_CLASS,
    "n-adj": NOUN_CLASS,
    "n-adv": NOUN_CLASS,
    "n-pre": NOUN_CLASS,
    "n-suf": NOUN_CLASS,
    "n-t": NOUN_CLASS,
    "prn": NOUN_CLASS,
    
    "v": VERB_CLASS,
    "v-adj": VERB_CLASS,
    "v-aux": VERB_CLASS,
    "v-k": VERB_CLASS,
    "v-pre": VERB_CLASS,
    "v-vs": VERB_CLASS,
    "v1": VERB_CLASS,
    "vi": VERB_CLASS,
    "vs": VERB_CLASS,
    "vt": VERB_CLASS,
    "vz": VERB_CLASS,
    "g-i": VERB_CLASS,
    "g-k": VERB_CLASS,
    "g5aru": VERB_CLASS,
    "g5b": VERB_CLASS,
    "g5g": VERB_CLASS,
    "g5k": VERB_CLASS,
    "g5k-s": VERB_CLASS,
    "g5m": VERB_CLASS,
    "g5r": VERB_CLASS,
    "g5r-irreg": VERB_CLASS,
    "g5s": VERB_CLASS,
    "g5t": VERB_CLASS,
    "g5u": VERB_CLASS,

    "adj": ADJECTIVE_CLASS,
    "adj-f": ADJECTIVE_CLASS,
    "adj-i": ADJECTIVE_CLASS,
    "adj-na": ADJECTIVE_CLASS,
    "adj-no": ADJECTIVE_CLASS,
    "adj-pre": ADJECTIVE_CLASS,
    "adj-t": ADJECTIVE_CLASS,
    "adj-aux": ADJECTIVE_CLASS,
    "adj-pn": ADJECTIVE_CLASS,

    "adv": ADVERB_CLASS,
    "adv-n": ADVERB_CLASS,
    "adv-t": ADVERB_CLASS,
    "adv-to": ADVERB_CLASS,

    "abbr": GRAMMAR_CLASS,
    "conj": GRAMMAR_CLASS,
    "part": GRAMMAR_CLASS,
    "prt": GRAMMAR_CLASS,
    "pre": GRAMMAR_CLASS,
    "suf": GRAMMAR_CLASS,

    "ateji": ASPECT_CLASS,
    "col": ASPECT_CLASS,
    "hon": ASPECT_CLASS,
    "hum": ASPECT_CLASS,
    "pol": ASPECT_CLASS,
    "ctr": ASPECT_CLASS,
    "num": ASPECT_CLASS,
    "exp": ASPECT_CLASS,
    "int": ASPECT_CLASS,
    "om-mim": ASPECT_CLASS,
};