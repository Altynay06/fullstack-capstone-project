from pathlib import Path
from flask import Flask, jsonify
from nltk.sentiment import SentimentIntensityAnalyzer

app = Flask(__name__)
lexicon = Path(__file__).parent / 'sentiment/vader_lexicon.zip'
sia = SentimentIntensityAnalyzer(lexicon_file=lexicon.as_uri() + '/vader_lexicon/vader_lexicon.txt')

@app.get('/')
def home():
    return jsonify(service='Sentiment analyzer', status='ok')

@app.get('/analyze/<path:input_txt>')
def analyze_sentiment(input_txt):
    score = sia.polarity_scores(input_txt)['compound']
    sentiment = 'positive' if score >= 0.05 else 'negative' if score <= -0.05 else 'neutral'
    return jsonify(sentiment=sentiment)

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5050)
