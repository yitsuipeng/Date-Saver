from serpapi.google_search_results import GoogleSearchResults

params = {
    "engine": "google_maps",
    "q": "coffee",
    "google_domain": "google.com",
    "type": "search",
    "ll": "@25.0399316,121.5624083,14z",
}

client = GoogleSearchResults(params)
data = client.get_dict()

print("Local results")