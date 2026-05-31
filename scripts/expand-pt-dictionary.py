#!/usr/bin/env python3
"""
Expand Portuguese dictionary (pt.ts) to cover all words in deck.json.

Strategy:
1. Parse deck.json to extract all unique Portuguese words
2. Parse pt.ts to find existing dictionary entries
3. For missing words:
   a. Check IRREGULAR_MAP / CONTRACTION_MAP for known forms
   b. Use co-occurrence with English translations to infer meaning
   c. Apply Portuguese IPA rules
   d. Detect POS from morphology
4. Output new entries in pt.ts format
"""

import json
import re
import sys
from collections import Counter, defaultdict
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent

# ─── Hardcoded translation table for ~500 most common Portuguese words ───
COMMON_TRANSLATIONS = {
    # Pronouns
    'eu': ('I', 'pron'), 'tu': ('you', 'pron'), 'ele': ('he', 'pron'),
    'ela': ('she', 'pron'), 'nós': ('we', 'pron'), 'vós': ('you (pl.)', 'pron'),
    'eles': ('they (m.)', 'pron'), 'elas': ('they (f.)', 'pron'),
    'me': ('me', 'pron'), 'te': ('you', 'pron'), 'se': ('oneself', 'pron'),
    'lhe': ('him, her', 'pron'), 'lhes': ('them', 'pron'),
    'nos': ('us', 'pron'), 'vos': ('you', 'pron'),
    'mim': ('me', 'pron'), 'ti': ('you', 'pron'), 'si': ('oneself', 'pron'),
    'isso': ('that', 'pron'), 'isto': ('this', 'pron'), 'aquilo': ('that (far)', 'pron'),
    'quem': ('who', 'pron'), 'qual': ('which', 'pron'), 'quais': ('which (pl.)', 'pron'),
    'algo': ('something', 'pron'), 'alguém': ('someone', 'pron'),
    'ninguém': ('nobody', 'pron'), 'nada': ('nothing', 'pron'),
    'tudo': ('everything', 'pron'), 'cada': ('each', 'det'),
    'outro': ('other', 'det'), 'outra': ('other', 'det'),
    'outros': ('others', 'det'), 'outras': ('others', 'det'),
    'mesmo': ('same, self', 'pron'), 'mesma': ('same, self', 'pron'),
    'mesmos': ('same, selves', 'pron'), 'mesmas': ('same, selves', 'pron'),
    'todo': ('all, every', 'det'), 'toda': ('all, every', 'det'),
    'todos': ('all, every', 'det'), 'todas': ('all, every', 'det'),
    'vocês': ('you (pl.)', 'pron'), 'você': ('you', 'pron'),
    'meu': ('my', 'det'), 'minha': ('my', 'det'),
    'meus': ('my', 'det'), 'minhas': ('my', 'det'),
    'teu': ('your', 'det'), 'tua': ('your', 'det'),
    'teus': ('your', 'det'), 'tuas': ('your', 'det'),
    'seu': ('his, her, your', 'det'), 'sua': ('his, her, your', 'det'),
    'seus': ('his, her, your', 'det'), 'suas': ('his, her, your', 'det'),
    'nosso': ('our', 'det'), 'nossa': ('our', 'det'),
    'nossos': ('our', 'det'), 'nossas': ('our', 'det'),
    'dele': ('his', 'pron'), 'dela': ('her', 'pron'),
    'deles': ('their', 'pron'), 'delas': ('their', 'pron'),
    'este': ('this', 'det'), 'esta': ('this', 'det'),
    'estes': ('these', 'det'), 'estas': ('these', 'det'),
    'esse': ('that', 'det'), 'essa': ('that', 'det'),
    'esses': ('those', 'det'), 'essas': ('those', 'det'),
    'aquele': ('that', 'det'), 'aquela': ('that', 'det'),
    'aqueles': ('those', 'det'), 'aquelas': ('those', 'det'),

    # Articles
    'o': ('the', 'det'), 'a': ('the, to, at', 'det'),
    'os': ('the', 'det'), 'as': ('the', 'det'),
    'um': ('a, one', 'det'), 'uma': ('a, one', 'det'),
    'uns': ('some', 'det'), 'umas': ('some', 'det'),

    # Prepositions
    'de': ('of, from', 'prep'), 'em': ('in, on, at', 'prep'),
    'para': ('for, to', 'prep'), 'por': ('by, for, through', 'prep'),
    'com': ('with', 'prep'), 'sem': ('without', 'prep'),
    'sobre': ('about, on', 'prep'), 'entre': ('between, among', 'prep'),
    'até': ('until, even', 'prep'), 'desde': ('since, from', 'prep'),
    'após': ('after', 'prep'), 'durante': ('during', 'prep'),
    'contra': ('against', 'prep'), 'sob': ('under', 'prep'),
    'perante': ('before, in front of', 'prep'),
    'segundo': ('according to, second', 'prep'),
    'conforme': ('according to', 'prep'),

    # Conjunctions
    'e': ('and', 'conj'), 'ou': ('or', 'conj'), 'mas': ('but', 'conj'),
    'porém': ('however', 'conj'), 'porque': ('because', 'conj'),
    'pois': ('because, then', 'conj'), 'que': ('that, which', 'conj'),
    'se': ('if', 'conj'), 'quando': ('when', 'conj'),
    'enquanto': ('while', 'conj'), 'embora': ('although', 'conj'),
    'portanto': ('therefore', 'conj'), 'porquanto': ('inasmuch as', 'conj'),
    'nem': ('nor, not even', 'conj'), 'como': ('as, like, how', 'conj'),
    'já': ('already, now', 'adv'), 'ainda': ('still, yet', 'adv'),
    'também': ('also, too', 'adv'), 'então': ('then, so', 'adv'),
    'assim': ('thus, so', 'adv'), 'talvez': ('maybe, perhaps', 'adv'),
    'sempre': ('always', 'adv'), 'nunca': ('never', 'adv'),
    'jamais': ('never', 'adv'),

    # Contractions (they appear as separate words sometimes)
    'do': ('of the', 'prep'), 'da': ('of the', 'prep'),
    'dos': ('of the', 'prep'), 'das': ('of the', 'prep'),
    'no': ('in the', 'prep'), 'na': ('in the', 'prep'),
    'nos': ('in the, us', 'prep'), 'nas': ('in the', 'prep'),
    'ao': ('to the', 'prep'), 'aos': ('to the', 'prep'),
    'pelo': ('through the', 'prep'), 'pela': ('through the', 'prep'),
    'pelos': ('through the', 'prep'), 'pelas': ('through the', 'prep'),
    'num': ('in a', 'prep'), 'numa': ('in a', 'prep'),
    'neste': ('in this', 'prep'), 'nesta': ('in this', 'prep'),
    'nesse': ('in that', 'prep'), 'nessa': ('in that', 'prep'),
    'naquele': ('in that', 'prep'), 'naquela': ('in that', 'prep'),
    'deste': ('of this', 'prep'), 'desta': ('of this', 'prep'),
    'desse': ('of that', 'prep'), 'dessa': ('of that', 'prep'),
    'daquele': ('of that', 'prep'), 'daquela': ('of that', 'prep'),
    'nisso': ('in that', 'prep'), 'nisto': ('in this', 'prep'),
    'naquilo': ('in that', 'prep'),
    'disso': ('of that', 'prep'), 'disto': ('of this', 'prep'),
    'daquilo': ('of that', 'prep'),

    # Adverbs
    'não': ('not, no', 'adv'), 'sim': ('yes', 'adv'),
    'mais': ('more, most', 'adv'), 'menos': ('less, fewer', 'adv'),
    'muito': ('very, much', 'adv'), 'muita': ('much, a lot of', 'det'),
    'muitos': ('many', 'det'), 'muitas': ('many', 'det'),
    'pouco': ('little, few', 'adv'), 'poucos': ('few', 'det'),
    'bem': ('well', 'adv'), 'mal': ('badly, evil', 'adv'),
    'só': ('only, alone', 'adv'), 'apenas': ('only, just', 'adv'),
    'agora': ('now', 'adv'), 'hoje': ('today', 'adv'),
    'ontem': ('yesterday', 'adv'), 'amanhã': ('tomorrow', 'adv'),
    'aqui': ('here', 'adv'), 'ali': ('there', 'adv'),
    'lá': ('there', 'adv'), 'cá': ('here', 'adv'),
    'onde': ('where', 'adv'), 'aonde': ('to where', 'adv'),
    'fora': ('outside', 'adv'), 'dentro': ('inside', 'adv'),
    'cima': ('top, above', 'adv'), 'baixo': ('low, down', 'adv'),
    'longe': ('far', 'adv'), 'perto': ('near', 'adv'),
    'antes': ('before', 'adv'), 'depois': ('after', 'adv'),
    'cedo': ('early', 'adv'), 'tarde': ('late, afternoon', 'adv'),
    'logo': ('soon, therefore', 'adv'), 'demais': ('too much', 'adv'),
    'bastante': ('enough, quite', 'adv'), 'quase': ('almost', 'adv'),
    'realmente': ('really', 'adv'), 'certamente': ('certainly', 'adv'),
    'principalmente': ('mainly', 'adv'), 'especialmente': ('especially', 'adv'),
    'normalmente': ('normally', 'adv'), 'geralmente': ('generally', 'adv'),
    'provavelmente': ('probably', 'adv'), 'rapidamente': ('quickly', 'adv'),
    'lentamente': ('slowly', 'adv'), 'finalmente': ('finally', 'adv'),
    'recentemente': ('recently', 'adv'), 'completamente': ('completely', 'adv'),
    'totalmente': ('totally', 'adv'), 'absolutamente': ('absolutely', 'adv'),
    'simplesmente': ('simply', 'adv'), 'exatamente': ('exactly', 'adv'),
    'praticamente': ('practically', 'adv'), 'diretamente': ('directly', 'adv'),
    'infelizmente': ('unfortunately', 'adv'), 'felizmente': ('fortunately', 'adv'),

    # Common nouns
    'casa': ('house, home', 'n'), 'tempo': ('time, weather', 'n'),
    'dia': ('day', 'n'), 'dias': ('days', 'n'),
    'noite': ('night', 'n'), 'manhã': ('morning', 'n'),
    'vez': ('time, turn', 'n'), 'vezes': ('times', 'n'),
    'ano': ('year', 'n'), 'anos': ('years', 'n'),
    'mês': ('month', 'n'), 'meses': ('months', 'n'),
    'hora': ('hour, time', 'n'), 'horas': ('hours', 'n'),
    'semana': ('week', 'n'), 'semanas': ('weeks', 'n'),
    'mundo': ('world', 'n'), 'vida': ('life', 'n'),
    'homem': ('man', 'n'), 'mulher': ('woman', 'n'),
    'criança': ('child', 'n'), 'crianças': ('children', 'n'),
    'pai': ('father', 'n'), 'mãe': ('mother', 'n'),
    'pais': ('parents, country (pl.)', 'n'), 'filho': ('son', 'n'),
    'filha': ('daughter', 'n'), 'filhos': ('sons, children', 'n'),
    'família': ('family', 'n'), 'amigo': ('friend', 'n'),
    'amiga': ('friend (f.)', 'n'), 'amigos': ('friends', 'n'),
    'gente': ('people', 'n'), 'pessoa': ('person', 'n'),
    'pessoas': ('people', 'n'), 'coisa': ('thing', 'n'),
    'coisas': ('things', 'n'), 'lugar': ('place', 'n'),
    'cidade': ('city', 'n'), 'país': ('country', 'n'),
    'rua': ('street', 'n'), 'escola': ('school', 'n'),
    'trabalho': ('work, job', 'n'), 'água': ('water', 'n'),
    'comida': ('food', 'n'), 'dinheiro': ('money', 'n'),
    'carro': ('car', 'n'), 'livro': ('book', 'n'),
    'porta': ('door', 'n'), 'mesa': ('table', 'n'),
    'problema': ('problem', 'n'), 'forma': ('form, way', 'n'),
    'parte': ('part', 'n'), 'lado': ('side', 'n'),
    'olho': ('eye', 'n'), 'olhos': ('eyes', 'n'),
    'mão': ('hand', 'n'), 'mãos': ('hands', 'n'),
    'cabeça': ('head', 'n'), 'corpo': ('body', 'n'),
    'pé': ('foot', 'n'), 'pés': ('feet', 'n'),
    'nome': ('name', 'n'), 'número': ('number', 'n'),
    'fim': ('end', 'n'), 'início': ('beginning', 'n'),
    'exemplo': ('example', 'n'), 'tipo': ('type, kind', 'n'),
    'modo': ('way, manner', 'n'), 'grupo': ('group', 'n'),
    'momento': ('moment', 'n'), 'caso': ('case', 'n'),
    'história': ('history, story', 'n'), 'ideia': ('idea', 'n'),
    'governo': ('government', 'n'), 'estado': ('state', 'n'),
    'empresa': ('company', 'n'), 'projeto': ('project', 'n'),
    'processo': ('process', 'n'), 'situação': ('situation', 'n'),
    'questão': ('question, issue', 'n'), 'região': ('region', 'n'),
    'resultado': ('result', 'n'), 'caminho': ('path, way', 'n'),
    'direito': ('right, law', 'n'), 'razão': ('reason', 'n'),
    'ponto': ('point', 'n'), 'jeito': ('way, manner', 'n'),
    'conta': ('account, bill', 'n'), 'festa': ('party', 'n'),
    'jogo': ('game', 'n'), 'música': ('music', 'n'),
    'filme': ('movie, film', 'n'), 'viagem': ('trip, journey', 'n'),
    'comércio': ('commerce, trade', 'n'), 'mercado': ('market', 'n'),
    'restaurante': ('restaurant', 'n'), 'hotel': ('hotel', 'n'),
    'praia': ('beach', 'n'), 'rio': ('river', 'n'),
    'mar': ('sea', 'n'), 'sol': ('sun', 'n'),
    'chuva': ('rain', 'n'), 'vento': ('wind', 'n'),
    'árvore': ('tree', 'n'), 'flor': ('flower', 'n'),
    'terra': ('earth, land', 'n'), 'céu': ('sky, heaven', 'n'),
    'luz': ('light', 'n'), 'cor': ('color', 'n'),
    'roupa': ('clothes', 'n'), 'roupas': ('clothes', 'n'),
    'sapato': ('shoe', 'n'), 'chapéu': ('hat', 'n'),
    'bolsa': ('bag, purse', 'n'), 'chave': ('key', 'n'),
    'telefone': ('telephone', 'n'), 'computador': ('computer', 'n'),
    'internet': ('internet', 'n'), 'informação': ('information', 'n'),
    'café': ('coffee, café', 'n'), 'chá': ('tea', 'n'),
    'leite': ('milk', 'n'), 'pão': ('bread', 'n'),
    'carne': ('meat', 'n'), 'peixe': ('fish', 'n'),
    'fruta': ('fruit', 'n'), 'arroz': ('rice', 'n'),
    'feijão': ('beans', 'n'), 'açúcar': ('sugar', 'n'),
    'sal': ('salt', 'n'), 'ovo': ('egg', 'n'),
    'ovos': ('eggs', 'n'), 'queijo': ('cheese', 'n'),

    # Common adjectives
    'bom': ('good', 'adj'), 'boa': ('good', 'adj'),
    'bons': ('good', 'adj'), 'boas': ('good', 'adj'),
    'mau': ('bad', 'adj'), 'má': ('bad', 'adj'),
    'grande': ('big, great', 'adj'), 'grandes': ('big, great', 'adj'),
    'pequeno': ('small', 'adj'), 'pequena': ('small', 'adj'),
    'novo': ('new, young', 'adj'), 'nova': ('new, young', 'adj'),
    'novos': ('new, young', 'adj'), 'novas': ('new, young', 'adj'),
    'velho': ('old', 'adj'), 'velha': ('old', 'adj'),
    'alto': ('tall, high', 'adj'), 'alta': ('tall, high', 'adj'),
    'longo': ('long', 'adj'), 'longa': ('long', 'adj'),
    'primeiro': ('first', 'adj'), 'primeira': ('first', 'adj'),
    'último': ('last', 'adj'), 'última': ('last', 'adj'),
    'melhor': ('better, best', 'adj'), 'pior': ('worse, worst', 'adj'),
    'maior': ('bigger, biggest', 'adj'), 'menor': ('smaller, smallest', 'adj'),
    'bonito': ('beautiful', 'adj'), 'bonita': ('beautiful', 'adj'),
    'feio': ('ugly', 'adj'), 'feia': ('ugly', 'adj'),
    'certo': ('right, certain', 'adj'), 'certa': ('right, certain', 'adj'),
    'possível': ('possible', 'adj'), 'impossível': ('impossible', 'adj'),
    'difícil': ('difficult', 'adj'), 'fácil': ('easy', 'adj'),
    'importante': ('important', 'adj'), 'necessário': ('necessary', 'adj'),
    'diferente': ('different', 'adj'), 'igual': ('equal, same', 'adj'),
    'próprio': ('own', 'adj'), 'própria': ('own', 'adj'),
    'próximo': ('next, near', 'adj'), 'próxima': ('next, near', 'adj'),
    'junto': ('together', 'adj'), 'juntos': ('together', 'adj'),
    'juntas': ('together', 'adj'),
    'pronto': ('ready', 'adj'), 'pronta': ('ready', 'adj'),
    'livre': ('free', 'adj'), 'feliz': ('happy', 'adj'),
    'triste': ('sad', 'adj'), 'forte': ('strong', 'adj'),
    'rico': ('rich', 'adj'), 'pobre': ('poor', 'adj'),
    'jovem': ('young', 'adj'), 'antigo': ('old, ancient', 'adj'),
    'claro': ('clear, light', 'adj'), 'escuro': ('dark', 'adj'),
    'quente': ('hot', 'adj'), 'frio': ('cold', 'adj'),
    'seco': ('dry', 'adj'), 'limpo': ('clean', 'adj'),
    'sujo': ('dirty', 'adj'), 'cheio': ('full', 'adj'),
    'vazio': ('empty', 'adj'), 'largo': ('wide', 'adj'),
    'curto': ('short', 'adj'), 'rápido': ('fast', 'adj'),
    'lento': ('slow', 'adj'), 'seguro': ('safe, sure', 'adj'),
    'perigoso': ('dangerous', 'adj'), 'verdadeiro': ('true, real', 'adj'),
    'falso': ('false', 'adj'), 'caro': ('expensive', 'adj'),
    'barato': ('cheap', 'adj'), 'único': ('only, unique', 'adj'),
    'inteiro': ('whole, entire', 'adj'), 'simples': ('simple', 'adj'),
    'capaz': ('capable', 'adj'), 'disponível': ('available', 'adj'),

    # Common verbs (infinitives)
    'ser': ('to be', 'v'), 'estar': ('to be (state)', 'v'),
    'ter': ('to have', 'v'), 'haver': ('to have (aux.)', 'v'),
    'ir': ('to go', 'v'), 'vir': ('to come', 'v'),
    'fazer': ('to do, to make', 'v'), 'dizer': ('to say, to tell', 'v'),
    'dar': ('to give', 'v'), 'ver': ('to see', 'v'),
    'poder': ('to be able to', 'v'), 'saber': ('to know', 'v'),
    'querer': ('to want', 'v'), 'ficar': ('to stay, to become', 'v'),
    'pôr': ('to put', 'v'), 'falar': ('to speak, to talk', 'v'),
    'comer': ('to eat', 'v'), 'beber': ('to drink', 'v'),
    'dormir': ('to sleep', 'v'), 'morar': ('to live (reside)', 'v'),
    'gostar': ('to like', 'v'), 'precisar': ('to need', 'v'),
    'trabalhar': ('to work', 'v'), 'estudar': ('to study', 'v'),
    'aprender': ('to learn', 'v'), 'ensinar': ('to teach', 'v'),
    'comprar': ('to buy', 'v'), 'vender': ('to sell', 'v'),
    'pagar': ('to pay', 'v'), 'ajudar': ('to help', 'v'),
    'pensar': ('to think', 'v'), 'achar': ('to find, to think', 'v'),
    'olhar': ('to look', 'v'), 'ouvir': ('to hear', 'v'),
    'sentir': ('to feel', 'v'), 'andar': ('to walk', 'v'),
    'correr': ('to run', 'v'), 'abrir': ('to open', 'v'),
    'fechar': ('to close', 'v'), 'começar': ('to start, to begin', 'v'),
    'acabar': ('to finish, to end', 'v'), 'tentar': ('to try', 'v'),
    'esperar': ('to wait, to hope', 'v'), 'perguntar': ('to ask', 'v'),
    'responder': ('to answer, to respond', 'v'),
    'chamar': ('to call', 'v'), 'contar': ('to count, to tell', 'v'),
    'usar': ('to use', 'v'), 'deixar': ('to leave, to let', 'v'),
    'passar': ('to pass, to spend', 'v'), 'levar': ('to take, to carry', 'v'),
    'trazer': ('to bring', 'v'), 'pedir': ('to ask for, to order', 'v'),
    'perder': ('to lose', 'v'), 'ganhar': ('to win, to earn', 'v'),
    'jogar': ('to play, to throw', 'v'), 'tocar': ('to touch, to play', 'v'),
    'cantar': ('to sing', 'v'), 'dançar': ('to dance', 'v'),
    'nadar': ('to swim', 'v'), 'viajar': ('to travel', 'v'),
    'voltar': ('to return', 'v'), 'sair': ('to leave, to go out', 'v'),
    'entrar': ('to enter', 'v'), 'chegar': ('to arrive', 'v'),
    'partir': ('to leave, to depart', 'v'), 'seguir': ('to follow', 'v'),
    'mudar': ('to change, to move', 'v'), 'trocar': ('to exchange, to change', 'v'),
    'cuidar': ('to take care', 'v'), 'conhecer': ('to know, to meet', 'v'),
    'lembrar': ('to remember', 'v'), 'esquecer': ('to forget', 'v'),
    'escolher': ('to choose', 'v'), 'decidir': ('to decide', 'v'),
    'conseguir': ('to manage, to get', 'v'), 'manter': ('to maintain, to keep', 'v'),
    'parecer': ('to seem', 'v'), 'preferir': ('to prefer', 'v'),
    'receber': ('to receive', 'v'), 'enviar': ('to send', 'v'),
    'mandar': ('to send, to order', 'v'), 'escrever': ('to write', 'v'),
    'ler': ('to read', 'v'), 'ligar': ('to call, to turn on', 'v'),
    'desligar': ('to hang up, to turn off', 'v'),
    'cortar': ('to cut', 'v'), 'limpar': ('to clean', 'v'),
    'cozinhar': ('to cook', 'v'), 'preparar': ('to prepare', 'v'),
    'servir': ('to serve', 'v'), 'subir': ('to go up, to climb', 'v'),
    'descer': ('to go down, to descend', 'v'),
    'crescer': ('to grow', 'v'), 'nascer': ('to be born', 'v'),
    'morrer': ('to die', 'v'), 'viver': ('to live', 'v'),
    'acontecer': ('to happen', 'v'), 'existir': ('to exist', 'v'),
    'criar': ('to create', 'v'), 'construir': ('to build', 'v'),
    'desenvolver': ('to develop', 'v'), 'produzir': ('to produce', 'v'),
    'realizar': ('to carry out, to achieve', 'v'),
    'permitir': ('to allow, to permit', 'v'),
    'oferecer': ('to offer', 'v'), 'apresentar': ('to present', 'v'),
    'explicar': ('to explain', 'v'), 'entender': ('to understand', 'v'),
    'compreender': ('to understand', 'v'), 'significar': ('to mean', 'v'),
    'acreditar': ('to believe', 'v'), 'imaginar': ('to imagine', 'v'),
    'encontrar': ('to find, to meet', 'v'), 'buscar': ('to look for, to fetch', 'v'),
    'procurar': ('to look for, to search', 'v'),
    'descobrir': ('to discover', 'v'), 'reconhecer': ('to recognize', 'v'),
    'considerar': ('to consider', 'v'), 'aceitar': ('to accept', 'v'),
    'notar': ('to notice', 'v'), 'observar': ('to observe', 'v'),
    'guardar': ('to keep, to store', 'v'), 'caber': ('to fit', 'v'),
    'valer': ('to be worth', 'v'), 'pertencer': ('to belong', 'v'),
    'depender': ('to depend', 'v'), 'contribuir': ('to contribute', 'v'),
    'participar': ('to participate', 'v'), 'representar': ('to represent', 'v'),
    'incluir': ('to include', 'v'), 'evitar': ('to avoid', 'v'),
    'preocupar': ('to worry', 'v'), 'interessar': ('to interest', 'v'),
    'aproveitar': ('to enjoy, to take advantage', 'v'),
    'resolver': ('to solve, to resolve', 'v'),
    'continuar': ('to continue', 'v'), 'parar': ('to stop', 'v'),
    'terminar': ('to finish, to end', 'v'),
    'compartilhar': ('to share', 'v'), 'dividir': ('to divide, to share', 'v'),
    'combinar': ('to combine, to arrange', 'v'),
    'organizar': ('to organize', 'v'), 'planejar': ('to plan', 'v'),
    'investir': ('to invest', 'v'), 'gastar': ('to spend', 'v'),
    'economizar': ('to save (money)', 'v'), 'alugar': ('to rent', 'v'),
    'reservar': ('to book, to reserve', 'v'),
    'instalar': ('to install', 'v'), 'funcionar': ('to work, to function', 'v'),
    'verificar': ('to verify, to check', 'v'),
    'melhorar': ('to improve', 'v'), 'piorar': ('to worsen', 'v'),
    'proteger': ('to protect', 'v'), 'salvar': ('to save', 'v'),
    'destruir': ('to destroy', 'v'), 'mover': ('to move', 'v'),
    'colocar': ('to put, to place', 'v'), 'tirar': ('to take off, to remove', 'v'),
    'puxar': ('to pull', 'v'), 'empurrar': ('to push', 'v'),
    'segurar': ('to hold', 'v'), 'soltar': ('to release, to let go', 'v'),
    'mostrar': ('to show', 'v'), 'indicar': ('to indicate', 'v'),
    'sugerir': ('to suggest', 'v'), 'recomendar': ('to recommend', 'v'),
    'prometer': ('to promise', 'v'), 'garantir': ('to guarantee', 'v'),
    'permitir': ('to allow', 'v'), 'proibir': ('to forbid, to prohibit', 'v'),
    'exigir': ('to demand, to require', 'v'),
    'agradecer': ('to thank', 'v'), 'cumprimentar': ('to greet', 'v'),
    'convidar': ('to invite', 'v'), 'visitar': ('to visit', 'v'),
    'casar': ('to marry', 'v'), 'separar': ('to separate', 'v'),
    'namorar': ('to date', 'v'), 'abraçar': ('to hug', 'v'),
    'beijar': ('to kiss', 'v'), 'amar': ('to love', 'v'),
    'odiar': ('to hate', 'v'), 'respeitar': ('to respect', 'v'),
    'admirar': ('to admire', 'v'), 'apoiar': ('to support', 'v'),
    'dirigir': ('to drive, to direct', 'v'),
    'estacionar': ('to park', 'v'), 'acelerar': ('to accelerate', 'v'),
    'frear': ('to brake', 'v'), 'voar': ('to fly', 'v'),
    'embarcar': ('to board', 'v'), 'desembarcar': ('to disembark', 'v'),
    'carregar': ('to carry, to charge', 'v'),
    'descarregar': ('to unload, to discharge', 'v'),
    'importar': ('to matter, to import', 'v'),
    'exportar': ('to export', 'v'),
    'publicar': ('to publish', 'v'),
    'registrar': ('to register', 'v'),
    'assinar': ('to sign', 'v'),
    'aprovar': ('to approve', 'v'),
    'negar': ('to deny', 'v'),
    'confirmar': ('to confirm', 'v'),
    'cancelar': ('to cancel', 'v'),
    'adiar': ('to postpone', 'v'),
    'adiantar': ('to advance, to be of use', 'v'),
    'atrasar': ('to delay', 'v'),
    'durar': ('to last', 'v'),
    'sobreviver': ('to survive', 'v'),
    'sofrer': ('to suffer', 'v'),
    'chorar': ('to cry', 'v'),
    'rir': ('to laugh', 'v'),
    'sorrir': ('to smile', 'v'),
    'gritar': ('to shout', 'v'),
    'sussurrar': ('to whisper', 'v'),
    'rezar': ('to pray', 'v'),
    'sonhar': ('to dream', 'v'),
    'acordar': ('to wake up', 'v'),

    # Common question words
    'quanto': ('how much', 'det'), 'quanta': ('how much', 'det'),
    'quantos': ('how many', 'det'), 'quantas': ('how many', 'det'),

    # Numbers
    'dois': ('two', 'det'), 'duas': ('two', 'det'),
    'três': ('three', 'det'), 'quatro': ('four', 'det'),
    'cinco': ('five', 'det'), 'seis': ('six', 'det'),
    'sete': ('seven', 'det'), 'oito': ('eight', 'det'),
    'nove': ('nine', 'det'), 'dez': ('ten', 'det'),

    # Days/months
    'segunda': ('Monday', 'n'), 'terça': ('Tuesday', 'n'),
    'quarta': ('Wednesday', 'n'), 'quinta': ('Thursday', 'n'),
    'sexta': ('Friday', 'n'), 'sábado': ('Saturday', 'n'),
    'domingo': ('Sunday', 'n'),
    'janeiro': ('January', 'n'), 'fevereiro': ('February', 'n'),
    'março': ('March', 'n'), 'abril': ('April', 'n'),
    'maio': ('May', 'n'), 'junho': ('June', 'n'),
    'julho': ('July', 'n'), 'agosto': ('August', 'n'),
    'setembro': ('September', 'n'), 'outubro': ('October', 'n'),
    'novembro': ('November', 'n'), 'dezembro': ('December', 'n'),
}

# ─── Verb conjugation → infinitive mapping ───
# This handles regular conjugation patterns
def guess_infinitive(word):
    """Try to recover the infinitive from a conjugated verb form."""
    # Check common regular patterns
    patterns = [
        # -ar verbs
        (r'^(.+)ando$', r'\1ar', 'gerund'),      # falando → falar
        (r'^(.+)ado$', r'\1ar', 'participle'),     # falado → falar
        (r'^(.+)ada$', r'\1ar', 'participle'),     # falada → falar
        (r'^(.+)ados$', r'\1ar', 'participle'),
        (r'^(.+)adas$', r'\1ar', 'participle'),
        (r'^(.+)amos$', r'\1ar', 'present/preterite'),  # falamos → falar
        (r'^(.+)aram$', r'\1ar', 'preterite'),     # falaram → falar
        (r'^(.+)ava$', r'\1ar', 'imperfect'),      # falava → falar
        (r'^(.+)avam$', r'\1ar', 'imperfect'),     # falavam → falar
        (r'^(.+)ávamos$', r'\1ar', 'imperfect'),
        (r'^(.+)aria$', r'\1ar', 'conditional'),   # falaria → falar
        (r'^(.+)ariam$', r'\1ar', 'conditional'),
        (r'^(.+)aríamos$', r'\1ar', 'conditional'),
        (r'^(.+)arei$', r'\1ar', 'future'),        # falarei → falar
        (r'^(.+)ará$', r'\1ar', 'future'),
        (r'^(.+)aremos$', r'\1ar', 'future'),
        (r'^(.+)arão$', r'\1ar', 'future'),
        (r'^(.+)asse$', r'\1ar', 'subj_imp'),      # falasse → falar
        (r'^(.+)assem$', r'\1ar', 'subj_imp'),
        (r'^(.+)ássemos$', r'\1ar', 'subj_imp'),
        (r'^(.+)arem$', r'\1ar', 'future_subj'),   # falarem → falar
        (r'^(.+)armos$', r'\1ar', 'future_subj'),
        (r'^(.+)ara$', r'\1ar', 'pluperfect'),     # falara → falar
        (r'^(.+)ou$', r'\1ar', 'preterite_3s'),    # falou → falar
        (r'^(.+)ei$', r'\1ar', 'preterite_1s'),    # falei → falar
        (r'^(.+)e$', r'\1ar', 'subj_pres'),        # fale → falar
        (r'^(.+)em$', r'\1ar', 'subj_pres'),       # falem → falar

        # -er verbs
        (r'^(.+)endo$', r'\1er', 'gerund'),        # comendo → comer
        (r'^(.+)ido$', r'\1er', 'participle'),     # comido → comer (also -ir)
        (r'^(.+)ida$', r'\1er', 'participle'),
        (r'^(.+)emos$', r'\1er', 'present'),       # comemos → comer
        (r'^(.+)eram$', r'\1er', 'preterite'),     # comeram → comer
        (r'^(.+)ia$', r'\1er', 'imperfect'),       # comia → comer
        (r'^(.+)iam$', r'\1er', 'imperfect'),
        (r'^(.+)íamos$', r'\1er', 'imperfect'),
        (r'^(.+)eria$', r'\1er', 'conditional'),
        (r'^(.+)eriam$', r'\1er', 'conditional'),
        (r'^(.+)eríamos$', r'\1er', 'conditional'),
        (r'^(.+)erei$', r'\1er', 'future'),
        (r'^(.+)erá$', r'\1er', 'future'),
        (r'^(.+)eremos$', r'\1er', 'future'),
        (r'^(.+)erão$', r'\1er', 'future'),
        (r'^(.+)esse$', r'\1er', 'subj_imp'),
        (r'^(.+)essem$', r'\1er', 'subj_imp'),
        (r'^(.+)êssemos$', r'\1er', 'subj_imp'),
        (r'^(.+)erem$', r'\1er', 'future_subj'),
        (r'^(.+)ermos$', r'\1er', 'future_subj'),
        (r'^(.+)eu$', r'\1er', 'preterite_3s'),    # comeu → comer

        # -ir verbs
        (r'^(.+)indo$', r'\1ir', 'gerund'),        # partindo → partir
        (r'^(.+)imos$', r'\1ir', 'present'),       # partimos → partir
        (r'^(.+)iram$', r'\1ir', 'preterite'),     # partiram → partir
        (r'^(.+)iria$', r'\1ir', 'conditional'),
        (r'^(.+)iriam$', r'\1ir', 'conditional'),
        (r'^(.+)iríamos$', r'\1ir', 'conditional'),
        (r'^(.+)irei$', r'\1ir', 'future'),
        (r'^(.+)irá$', r'\1ir', 'future'),
        (r'^(.+)iremos$', r'\1ir', 'future'),
        (r'^(.+)irão$', r'\1ir', 'future'),
        (r'^(.+)isse$', r'\1ir', 'subj_imp'),
        (r'^(.+)issem$', r'\1ir', 'subj_imp'),
        (r'^(.+)íssemos$', r'\1ir', 'subj_imp'),
        (r'^(.+)irem$', r'\1ir', 'future_subj'),
        (r'^(.+)irmos$', r'\1ir', 'future_subj'),
        (r'^(.+)iu$', r'\1ir', 'preterite_3s'),    # partiu → partir

        # Present tense singular
        (r'^(.+)a$', r'\1ar', 'present_3s'),       # fala → falar
        (r'^(.+)as$', r'\1ar', 'present_2s'),      # falas → falar
        (r'^(.+)o$', r'\1ar', 'present_1s'),       # falo → falar
    ]

    for pattern, replacement, tense in patterns:
        m = re.match(pattern, word)
        if m:
            infinitive = re.sub(pattern, replacement, word)
            if len(infinitive) >= 3:  # sanity check
                return infinitive
    return None


# ─── Portuguese IPA generator ───
def generate_ipa(word):
    """Generate approximate IPA for a Brazilian Portuguese word."""
    w = word.lower()

    # Syllabify and generate IPA
    ipa = w

    # Multi-char replacements first
    replacements = [
        ('ção', 'sɐ̃w̃'), ('ções', 'sõj̃ʃ'),
        ('são', 'sɐ̃w̃'),
        ('ão', 'ɐ̃w̃'), ('ãe', 'ɐ̃j̃'), ('ães', 'ɐ̃j̃ʃ'),
        ('ões', 'õj̃ʃ'), ('õe', 'õj̃'),
        ('ãos', 'ɐ̃w̃ʃ'),
        ('lh', 'ʎ'), ('nh', 'ɲ'), ('ch', 'ʃ'),
        ('rr', 'ʁ'), ('ss', 's'), ('qu', 'k'), ('gu', 'ɡ'),
        ('sc', 'ss'), ('sç', 'ss'), ('xc', 'ss'),
        ('ou', 'ow'), ('ei', 'ej'), ('oi', 'oj'),
        ('ai', 'aj'), ('au', 'aw'), ('eu', 'ew'),
        ('ãi', 'ɐ̃j̃'),
    ]
    for old, new in replacements:
        ipa = ipa.replace(old, new)

    # Accented vowels
    ipa = ipa.replace('á', 'a').replace('â', 'ɐ').replace('ã', 'ɐ̃')
    ipa = ipa.replace('é', 'ɛ').replace('ê', 'e')
    ipa = ipa.replace('í', 'i').replace('ï', 'i')
    ipa = ipa.replace('ó', 'ɔ').replace('ô', 'o').replace('õ', 'õ')
    ipa = ipa.replace('ú', 'u').replace('ü', 'u')
    ipa = ipa.replace('ç', 's')

    # Consonants
    # x → usually ʃ
    ipa = ipa.replace('x', 'ʃ')
    # j → ʒ
    ipa = ipa.replace('j', 'ʒ')
    # ge/gi → ʒe/ʒi
    ipa = re.sub(r'g([ei])', r'ʒ\1', ipa)

    # Final transformations for Brazilian Portuguese
    # Final -e → [i], final -o → [u]
    if ipa.endswith('e'):
        ipa = ipa[:-1] + 'i'
    if ipa.endswith('o'):
        ipa = ipa[:-1] + 'u'
    # -es → [iʃ], -os → [uʃ]
    if ipa.endswith('es'):
        ipa = ipa[:-2] + 'iʃ'
    if ipa.endswith('os'):
        ipa = ipa[:-2] + 'uʃ'

    # Initial r → ʁ
    if ipa.startswith('r'):
        ipa = 'ʁ' + ipa[1:]

    # Intervocalic s → z (simplified)
    vowels_set = set('aeiouɐɛɔãõɐ̃')
    result = list(ipa)
    for i in range(1, len(result) - 1):
        if result[i] == 's' and i > 0:
            prev = result[i-1] if i > 0 else ''
            nxt = result[i+1] if i < len(result)-1 else ''
            if prev in vowels_set and nxt in vowels_set:
                result[i] = 'z'
    ipa = ''.join(result)

    # Add syllable dots for readability
    # Simple approach: insert dots between consonant clusters
    # This is a rough approximation
    ipa_with_dots = add_syllable_dots(ipa)

    return ipa_with_dots


def add_syllable_dots(ipa):
    """Add syllable boundary dots to IPA."""
    vowels = set('aeiouɐɛɔãõɐ̃ɐ̃w̃õj̃')
    modifiers = set('̃ʃʒʎɲʁɾwj')

    # Simple approach - add dots before consonant+vowel sequences
    # after a vowel
    result = []
    i = 0
    chars = list(ipa)

    # Don't add dots for short words
    if len(ipa) <= 3:
        return ipa

    for i, c in enumerate(chars):
        result.append(c)

    # Actually, for dictionary display, just return clean IPA without dots
    # The existing entries use dots but it's complex to do correctly
    return ipa


# ─── POS detection ───
def detect_pos(word):
    """Detect part of speech from word morphology."""
    w = word.lower()

    # Function words
    articles = {'o', 'a', 'os', 'as', 'um', 'uma', 'uns', 'umas'}
    if w in articles:
        return 'det'

    prepositions = {'de', 'em', 'para', 'por', 'com', 'sem', 'sobre', 'entre',
                    'até', 'desde', 'após', 'durante', 'contra', 'sob', 'perante',
                    'conforme', 'segundo', 'ante', 'mediante', 'através', 'exceto',
                    'salvo', 'senão', 'afora', 'fora'}
    if w in prepositions:
        return 'prep'

    conjunctions = {'e', 'ou', 'mas', 'porém', 'porque', 'pois', 'que', 'se',
                    'quando', 'enquanto', 'embora', 'portanto', 'contudo',
                    'entretanto', 'todavia', 'nem', 'como', 'caso', 'logo',
                    'senão', 'ora', 'quer', 'já', 'conquanto', 'posto'}
    if w in conjunctions:
        return 'conj'

    pronouns = {'eu', 'tu', 'ele', 'ela', 'nós', 'vós', 'eles', 'elas',
                'me', 'te', 'se', 'lhe', 'lhes', 'nos', 'vos', 'mim', 'ti', 'si',
                'isso', 'isto', 'aquilo', 'quem', 'qual', 'quais', 'algo', 'alguém',
                'ninguém', 'nada', 'tudo', 'vocês', 'você',
                'meu', 'minha', 'meus', 'minhas', 'teu', 'tua', 'teus', 'tuas',
                'seu', 'sua', 'seus', 'suas', 'nosso', 'nossa', 'nossos', 'nossas',
                'dele', 'dela', 'deles', 'delas',
                'este', 'esta', 'estes', 'estas', 'esse', 'essa', 'esses', 'essas',
                'aquele', 'aquela', 'aqueles', 'aquelas'}
    if w in pronouns:
        return 'pron'

    # Verb infinitives
    if re.search(r'[aei]r$', w) and len(w) >= 3:
        return 'v'
    if w.endswith('ar-se') or w.endswith('er-se') or w.endswith('ir-se'):
        return 'v'

    # Adverbs ending in -mente
    if w.endswith('mente') and len(w) > 6:
        return 'adv'

    # Adjectives
    if re.search(r'(oso|osa|osos|osas|ável|ível|ante|ente|ado|ada|ido|ida|ivo|iva)$', w):
        return 'adj'

    # Nouns
    if re.search(r'(ção|são|dade|ismo|ista|ência|ância|mento|tura|agem|ário|ária)$', w):
        return 'n'

    # Default: noun (most common)
    return 'n'


# ─── Translation inference from deck sentences ───
def build_word_sentence_index(deck):
    """Build index: word → list of (pt_sentence, en_sentence) pairs."""
    index = defaultdict(list)
    for card in deck:
        pt_words = re.findall(r'[a-záàâãéèêíïóôõúüçñ]+', card['target'].lower())
        for w in pt_words:
            index[w].append((card['target'], card['english']))
    return index


def infer_translation_from_sentences(word, sentence_pairs, existing_dict):
    """
    Try to infer the English translation of a Portuguese word
    by analyzing co-occurring sentences.
    """
    if not sentence_pairs:
        return None

    # Collect all English words from sentences containing this Portuguese word
    en_word_counts = Counter()
    for pt_sent, en_sent in sentence_pairs:
        en_words = re.findall(r'[a-z]+', en_sent.lower())
        for w in en_words:
            en_word_counts[w] += 1

    # Get all English words from ALL sentences (to compute TF-IDF-like score)
    # We want words that are unusually common in sentences with this word
    # compared to overall frequency

    # Simple approach: use position-based alignment
    # For each sentence pair, find English words at similar relative positions
    position_words = Counter()
    for pt_sent, en_sent in sentence_pairs[:10]:  # limit to 10 sentences
        pt_tokens = re.findall(r'[a-záàâãéèêíïóôõúüçñ]+', pt_sent.lower())
        en_tokens = re.findall(r'[a-z\']+', en_sent.lower())

        if not pt_tokens or not en_tokens:
            continue

        try:
            pt_idx = pt_tokens.index(word)
        except ValueError:
            continue

        # Relative position
        rel_pos = pt_idx / len(pt_tokens)
        # Map to English position
        en_idx = int(rel_pos * len(en_tokens))
        # Take words in a window around that position
        window = 2
        for i in range(max(0, en_idx - window), min(len(en_tokens), en_idx + window + 1)):
            w = en_tokens[i]
            if w not in STOP_WORDS_EN:
                position_words[w] += 1

    # Combine frequency and position scores
    if position_words:
        return position_words.most_common(1)[0][0]

    # Fallback: most common non-stopword in co-occurring English sentences
    for w, c in en_word_counts.most_common(20):
        if w not in STOP_WORDS_EN and len(w) > 2:
            return w

    return None


STOP_WORDS_EN = {
    'the', 'a', 'an', 'is', 'are', 'was', 'were', 'be', 'been', 'being',
    'have', 'has', 'had', 'do', 'does', 'did', 'will', 'would', 'could',
    'should', 'may', 'might', 'shall', 'can', 'need', 'dare', 'ought',
    'used', 'to', 'of', 'in', 'for', 'on', 'with', 'at', 'by', 'from',
    'as', 'into', 'through', 'during', 'before', 'after', 'above', 'below',
    'between', 'out', 'off', 'over', 'under', 'again', 'further', 'then',
    'once', 'here', 'there', 'when', 'where', 'why', 'how', 'all', 'each',
    'every', 'both', 'few', 'more', 'most', 'other', 'some', 'such', 'no',
    'nor', 'not', 'only', 'own', 'same', 'so', 'than', 'too', 'very',
    'just', 'because', 'but', 'and', 'or', 'if', 'while', 'that', 'this',
    'these', 'those', 'it', 'its', 'i', 'me', 'my', 'we', 'our', 'you',
    'your', 'he', 'him', 'his', 'she', 'her', 'they', 'them', 'their',
    'what', 'which', 'who', 'whom', 'up', 'about', 's', 't', 'd', 'll',
    're', 've', 'don', 'didn', 'doesn', 'haven', 'hasn', 'hadn', 'won',
    'wouldn', 'couldn', 'shouldn', 'isn', 'aren', 'wasn', 'weren',
}

# ─── Verb form translation helper ───
# Map Portuguese verb infinitives to English translations
VERB_TRANSLATIONS = {
    'ser': 'to be', 'estar': 'to be', 'ter': 'to have', 'haver': 'to have',
    'ir': 'to go', 'vir': 'to come', 'fazer': 'to do, to make',
    'dizer': 'to say, to tell', 'dar': 'to give', 'ver': 'to see',
    'poder': 'to be able to', 'saber': 'to know', 'querer': 'to want',
    'ficar': 'to stay, to become', 'pôr': 'to put', 'falar': 'to speak',
    'comer': 'to eat', 'beber': 'to drink', 'dormir': 'to sleep',
    'morar': 'to live', 'gostar': 'to like', 'precisar': 'to need',
    'trabalhar': 'to work', 'estudar': 'to study', 'aprender': 'to learn',
    'comprar': 'to buy', 'vender': 'to sell', 'pagar': 'to pay',
    'ajudar': 'to help', 'pensar': 'to think', 'achar': 'to find, to think',
    'olhar': 'to look', 'ouvir': 'to hear', 'sentir': 'to feel',
    'andar': 'to walk', 'correr': 'to run', 'abrir': 'to open',
    'fechar': 'to close', 'começar': 'to start', 'acabar': 'to finish',
    'tentar': 'to try', 'esperar': 'to wait, to hope',
    'perguntar': 'to ask', 'responder': 'to answer',
    'chamar': 'to call', 'contar': 'to count, to tell',
    'usar': 'to use', 'deixar': 'to leave, to let',
    'passar': 'to pass, to spend', 'levar': 'to take, to carry',
    'trazer': 'to bring', 'pedir': 'to ask for, to order',
    'perder': 'to lose', 'ganhar': 'to win, to earn',
    'jogar': 'to play', 'tocar': 'to touch, to play',
    'cantar': 'to sing', 'dançar': 'to dance',
    'viajar': 'to travel', 'voltar': 'to return',
    'sair': 'to leave, to go out', 'entrar': 'to enter',
    'chegar': 'to arrive', 'partir': 'to leave, to depart',
    'seguir': 'to follow', 'mudar': 'to change',
    'trocar': 'to exchange', 'cuidar': 'to take care',
    'conhecer': 'to know, to meet', 'lembrar': 'to remember',
    'esquecer': 'to forget', 'escolher': 'to choose',
    'decidir': 'to decide', 'conseguir': 'to manage, to get',
    'manter': 'to maintain', 'parecer': 'to seem',
    'preferir': 'to prefer', 'receber': 'to receive',
    'enviar': 'to send', 'mandar': 'to send, to order',
    'escrever': 'to write', 'ler': 'to read',
    'ligar': 'to call, to turn on', 'cozinhar': 'to cook',
    'preparar': 'to prepare', 'servir': 'to serve',
    'subir': 'to go up', 'descer': 'to go down',
    'crescer': 'to grow', 'nascer': 'to be born',
    'morrer': 'to die', 'viver': 'to live',
    'acontecer': 'to happen', 'existir': 'to exist',
    'criar': 'to create', 'construir': 'to build',
    'desenvolver': 'to develop', 'realizar': 'to carry out',
    'permitir': 'to allow', 'oferecer': 'to offer',
    'apresentar': 'to present', 'explicar': 'to explain',
    'entender': 'to understand', 'compreender': 'to understand',
    'acreditar': 'to believe', 'imaginar': 'to imagine',
    'encontrar': 'to find, to meet', 'buscar': 'to look for',
    'procurar': 'to search', 'descobrir': 'to discover',
    'reconhecer': 'to recognize', 'considerar': 'to consider',
    'aceitar': 'to accept', 'notar': 'to notice',
    'guardar': 'to keep', 'valer': 'to be worth',
    'depender': 'to depend', 'contribuir': 'to contribute',
    'participar': 'to participate', 'incluir': 'to include',
    'evitar': 'to avoid', 'preocupar': 'to worry',
    'resolver': 'to solve', 'continuar': 'to continue',
    'parar': 'to stop', 'terminar': 'to finish',
    'organizar': 'to organize', 'planejar': 'to plan',
    'investir': 'to invest', 'gastar': 'to spend',
    'reservar': 'to book', 'funcionar': 'to work, to function',
    'verificar': 'to verify', 'melhorar': 'to improve',
    'proteger': 'to protect', 'colocar': 'to put, to place',
    'tirar': 'to remove', 'mostrar': 'to show',
    'sugerir': 'to suggest', 'recomendar': 'to recommend',
    'prometer': 'to promise', 'garantir': 'to guarantee',
    'exigir': 'to demand', 'agradecer': 'to thank',
    'convidar': 'to invite', 'visitar': 'to visit',
    'casar': 'to marry', 'amar': 'to love',
    'respeitar': 'to respect', 'apoiar': 'to support',
    'dirigir': 'to drive', 'voar': 'to fly',
    'importar': 'to matter', 'cancelar': 'to cancel',
    'adiar': 'to postpone', 'durar': 'to last',
    'sofrer': 'to suffer', 'chorar': 'to cry',
    'rir': 'to laugh', 'sorrir': 'to smile',
    'gritar': 'to shout', 'sonhar': 'to dream',
    'acordar': 'to wake up', 'nadar': 'to swim',
    'cortar': 'to cut', 'limpar': 'to clean',
    'carregar': 'to carry', 'confirmar': 'to confirm',
    'aprovar': 'to approve', 'negar': 'to deny',
    'publicar': 'to publish', 'registrar': 'to register',
    'assinar': 'to sign', 'instalar': 'to install',
    'desligar': 'to hang up', 'salvar': 'to save',
    'destruir': 'to destroy', 'mover': 'to move',
    'puxar': 'to pull', 'empurrar': 'to push',
    'segurar': 'to hold', 'indicar': 'to indicate',
    'proibir': 'to forbid', 'separar': 'to separate',
    'abraçar': 'to hug', 'beijar': 'to kiss',
    'admirar': 'to admire', 'embarcar': 'to board',
    'alugar': 'to rent', 'economizar': 'to save money',
    'frear': 'to brake', 'estacionar': 'to park',
    'acelerar': 'to accelerate', 'namorar': 'to date',
    'cumprimentar': 'to greet', 'soltar': 'to release',
    'rezar': 'to pray', 'sussurrar': 'to whisper',
    'sobreviver': 'to survive', 'piorar': 'to worsen',
    'desembarcar': 'to disembark', 'descarregar': 'to unload',
    'exportar': 'to export', 'adiantar': 'to advance',
    'atrasar': 'to delay', 'odiar': 'to hate',
    'ensinar': 'to teach', 'dividir': 'to divide',
    'combinar': 'to arrange', 'compartilhar': 'to share',
    'significar': 'to mean', 'representar': 'to represent',
    'pertencer': 'to belong', 'interessar': 'to interest',
    'aproveitar': 'to enjoy', 'observar': 'to observe',
    'produzir': 'to produce',
}


def translate_verb_form(word, infinitive):
    """Get translation for a conjugated verb form based on its infinitive."""
    if infinitive in VERB_TRANSLATIONS:
        return VERB_TRANSLATIONS[infinitive]
    if infinitive in COMMON_TRANSLATIONS:
        return COMMON_TRANSLATIONS[infinitive][0]
    return None


# ─── Parse existing dictionary ───
def parse_existing_dict(filepath):
    """Extract all existing dictionary keys from pt.ts."""
    with open(filepath) as f:
        content = f.read()

    # Find the dictionary section
    dict_start = content.index('const dictionary')
    dict_section = content[dict_start:]

    keys = set()
    # Match single-quoted, double-quoted, and unquoted keys
    for m in re.finditer(r"^\s+'([^']+)'\s*:", dict_section, re.MULTILINE):
        keys.add(m.group(1).lower())
    for m in re.finditer(r'^\s+"([^"]+)"\s*:', dict_section, re.MULTILINE):
        keys.add(m.group(1).lower())
    for m in re.finditer(r'^\s+(\w+)\s*:', dict_section, re.MULTILINE):
        keys.add(m.group(1).lower())

    return keys


def parse_irregular_map(filepath):
    """Extract IRREGULAR_MAP from pt.ts: conjugated form → infinitive."""
    with open(filepath) as f:
        content = f.read()

    irr_map = {}

    # Find IRREGULAR_MAP section
    irr_start = content.find('IRREGULAR_MAP')
    if irr_start == -1:
        return irr_map
    irr_section = content[irr_start:content.index('};', irr_start) + 2]

    for m in re.finditer(r"(\w+)\s*:\s*'([^']+)'", irr_section):
        irr_map[m.group(1).lower()] = m.group(2).lower()

    return irr_map


def parse_contraction_map(filepath):
    """Extract CONTRACTION_MAP from pt.ts."""
    with open(filepath) as f:
        content = f.read()

    contr_map = {}
    contr_start = content.find('CONTRACTION_MAP')
    if contr_start == -1:
        return contr_map
    contr_section = content[contr_start:content.index('};', contr_start) + 2]

    for m in re.finditer(r"'(\w+)'\s*:\s*\[([^\]]+)\]", contr_section):
        parts = re.findall(r"'([^']+)'", m.group(2))
        contr_map[m.group(1).lower()] = parts

    return contr_map


# ─── Better translation using sentence alignment ───
def get_best_translation(word, sentence_pairs, infinitive, existing_dict, irregular_map):
    """
    Get the best English translation for a Portuguese word, using multiple strategies.
    """
    # 1. Check hardcoded translations
    if word in COMMON_TRANSLATIONS:
        return COMMON_TRANSLATIONS[word][0]

    # 2. If it's a known verb form, translate via infinitive
    if infinitive:
        trans = translate_verb_form(word, infinitive)
        if trans:
            return trans

    # 3. Try to find infinitive via conjugation patterns
    guessed_inf = guess_infinitive(word)
    if guessed_inf:
        # Check if infinitive is in our translation tables
        trans = translate_verb_form(word, guessed_inf)
        if trans:
            return trans
        # Check if infinitive is in existing dict
        if guessed_inf in existing_dict:
            return None  # Will be filled via dict lookup later

    # 4. Infer from sentence pairs
    if sentence_pairs:
        inferred = infer_translation_from_sentences(word, sentence_pairs, existing_dict)
        if inferred:
            return inferred

    return None


# ─── Main ───
def main():
    pt_ts_path = ROOT / 'src' / 'data' / 'dictionary' / 'pt.ts'
    deck_path = ROOT / 'src' / 'data' / 'portuguese' / 'deck.json'

    # Load deck
    with open(deck_path) as f:
        deck = json.load(f)

    # Extract all unique words from deck
    deck_words = set()
    word_freq = Counter()
    for card in deck:
        tokens = re.findall(r'[a-záàâãéèêíïóôõúüçñ]+', card['target'].lower())
        deck_words.update(tokens)
        for t in tokens:
            word_freq[t] += 1

    print(f"Deck cards: {len(deck)}")
    print(f"Unique deck words: {len(deck_words)}")

    # Parse existing dictionary
    existing_keys = parse_existing_dict(pt_ts_path)
    print(f"Existing dictionary keys: {len(existing_keys)}")

    # Parse irregular map
    irregular_map = parse_irregular_map(pt_ts_path)
    print(f"Irregular map entries: {len(irregular_map)}")

    # Parse contraction map
    contraction_map = parse_contraction_map(pt_ts_path)
    print(f"Contraction map entries: {len(contraction_map)}")

    # Find missing words
    missing = deck_words - existing_keys
    print(f"\nMissing words: {len(missing)}")

    # Build sentence index
    sent_index = build_word_sentence_index(deck)

    # Generate entries for missing words
    new_entries = {}
    untranslatable = []

    for word in sorted(missing):
        # Skip very short words (single letters)
        if len(word) <= 1:
            continue

        # Check if it's a contraction
        if word in contraction_map:
            parts = contraction_map[word]
            en_trans = ' + '.join(parts)
            new_entries[word] = {
                'en': en_trans,
                'ipa': generate_ipa(word),
                'pos': 'prep',
            }
            continue

        # Check if it's an irregular verb form
        infinitive = irregular_map.get(word)

        # Get POS
        if word in COMMON_TRANSLATIONS:
            pos = COMMON_TRANSLATIONS[word][1]
        elif infinitive:
            pos = 'v'
        else:
            guessed_inf = guess_infinitive(word)
            if guessed_inf and (guessed_inf in VERB_TRANSLATIONS or guessed_inf in COMMON_TRANSLATIONS or guessed_inf in existing_keys):
                pos = 'v'
                infinitive = infinitive or guessed_inf
            else:
                pos = detect_pos(word)

        # Get translation
        sentence_pairs = sent_index.get(word, [])
        translation = get_best_translation(word, sentence_pairs, infinitive, existing_keys, irregular_map)

        if not translation:
            # Last resort: try inferring from sentences more aggressively
            if sentence_pairs:
                # Just take the most unique English word from co-occurring sentences
                en_words_here = Counter()
                for pt_sent, en_sent in sentence_pairs:
                    for w in re.findall(r'[a-z]+', en_sent.lower()):
                        if w not in STOP_WORDS_EN and len(w) > 2:
                            en_words_here[w] += 1
                if en_words_here:
                    translation = en_words_here.most_common(1)[0][0]

        if not translation:
            untranslatable.append((word, word_freq.get(word, 0)))
            # Use the word itself as a placeholder
            translation = f'({word})'

        # Add "to " prefix for verb infinitives
        if pos == 'v' and re.search(r'[aei]r$', word) and not translation.startswith('to '):
            translation = f'to {translation}'

        # Generate IPA
        ipa = generate_ipa(word)

        new_entries[word] = {
            'en': translation,
            'ipa': ipa,
            'pos': pos,
        }

    print(f"\nGenerated {len(new_entries)} new entries")
    print(f"Untranslatable: {len(untranslatable)}")

    if untranslatable:
        untranslatable.sort(key=lambda x: -x[1])
        print("\nTop 20 untranslatable words (by frequency):")
        for w, freq in untranslatable[:20]:
            print(f"  {w} (freq: {freq})")

    # ─── Generate TypeScript entries ───
    # Read existing file to find insertion point
    with open(pt_ts_path) as f:
        content = f.read()

    # Find the closing }; of the dictionary
    # We'll insert before the last };
    dict_end_marker = '\n};\n\nexport default dictionary;'
    if dict_end_marker not in content:
        # Try alternative
        dict_end_marker = '\n};\n\nexport default dictionary;'
        # More flexible search
        match = re.search(r'\n\};\s*\n\s*export default dictionary;', content)
        if match:
            insert_pos = match.start()
        else:
            print("ERROR: Could not find insertion point in pt.ts")
            sys.exit(1)
    else:
        insert_pos = content.index(dict_end_marker)

    # Generate the new entries text
    lines = []
    lines.append('')
    lines.append('  // ── Auto-expanded entries ──')

    current_letter = ''
    for word in sorted(new_entries.keys()):
        entry = new_entries[word]
        first_letter = word[0].upper()
        if first_letter != current_letter:
            current_letter = first_letter
            lines.append(f'  // ── {current_letter} (expanded) ──')

        # Escape single quotes in translations
        en = entry['en'].replace("'", "\\'")
        ipa = entry['ipa'].replace("'", "\\'")
        pos = entry['pos']

        # Use quotes for words with special chars
        if "'" in word or '-' in word or not word.isascii():
            key = f"'{word}'"
        else:
            key = word

        lines.append(f"  {key}: {{ en: '{en}', ipa: '{ipa}', pos: '{pos}' }},")

    new_text = '\n'.join(lines)

    # Insert new entries
    new_content = content[:insert_pos] + new_text + content[insert_pos:]

    with open(pt_ts_path, 'w') as f:
        f.write(new_content)

    # Report
    total_keys = len(existing_keys) + len(new_entries)
    coverage = total_keys / len(deck_words) * 100 if deck_words else 0

    print(f"\n{'='*50}")
    print(f"RESULTS:")
    print(f"  New entries added: {len(new_entries)}")
    print(f"  Previous entries: {len(existing_keys)}")
    print(f"  Total entries now: {total_keys}")
    print(f"  Deck unique words: {len(deck_words)}")
    print(f"  Coverage: {coverage:.1f}%")
    print(f"{'='*50}")


if __name__ == '__main__':
    main()
