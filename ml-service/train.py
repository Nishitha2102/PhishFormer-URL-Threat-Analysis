import pandas as pd
import lightgbm as lgb
from sklearn.model_selection import train_test_split
from sklearn.metrics import accuracy_score, classification_report
import joblib
import os

def train_model():
    print("Loading dataset...")
    dataset_path = os.path.join(os.path.dirname(__file__), '..', 'dataset_phishing.csv')
    df = pd.read_csv(dataset_path)

    # 45 features specified by user
    url_features = [
        'length_url', 'length_hostname', 'ip', 'nb_dots', 'nb_hyphens', 
        'nb_at', 'nb_qm', 'nb_and', 'nb_or', 'nb_eq', 'nb_underscore', 
        'nb_tilde', 'nb_percent', 'nb_slash', 'nb_star', 'nb_colon', 
        'nb_comma', 'nb_semicolumn', 'nb_dollar', 'http_in_path'
    ]

    html_features = [
        'login_form', 'external_favicon', 'links_in_tags', 'submit_email', 
        'sfh', 'iframe', 'popup_window', 'right_clic', 'domain_in_title', 
        'domain_with_copyright', 'empty_title', 'onmouseover', 'shortening_service', 
        'nb_redirection', 'nb_external_redirection', 'web_traffic', 'dns_record', 
        'google_index', 'page_rank', 'nb_hyperlinks', 'ratio_intHyperlinks', 
        'ratio_extHyperlinks', 'ratio_nullHyperlinks', 'nb_extCSS', 'ratio_intRedirection'
    ]
    
    selected_features = url_features + html_features
    target = 'status'

    print("Filtering dataset features...")
    X = df[selected_features]
    # legitimate = 0, phishing = 1
    y = df[target].apply(lambda x: 1 if x == 'phishing' else 0)

    # Split data
    X_train, X_test, y_train, y_test = train_test_split(X, y, test_size=0.2, random_state=42)

    print("Training LightGBM model...")
    model = lgb.LGBMClassifier(
        n_estimators=100,
        learning_rate=0.1,
        random_state=42
    )
    
    model.fit(X_train, y_train)

    print("Evaluating model...")
    y_pred = model.predict(X_test)
    acc = accuracy_score(y_test, y_pred)
    print(f"Accuracy: {acc:.4f}")
    print(classification_report(y_test, y_pred, target_names=['legitimate', 'phishing']))

    # Save model and feature mappings
    model_data = {
        'model': model,
        'features': selected_features,
        'accuracy': acc
    }
    joblib.dump(model_data, 'model.pkl')
    print("Model saved to model.pkl")

if __name__ == "__main__":
    train_model()
