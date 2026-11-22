// Web front end for Detective Mystery: The Hidden Truth.
// This program is a small local web server. All game rules stay in the C++ game
// classes; the browser (web/ folder) only draws the game and sends the same text
// commands the console game uses. Run it, and it opens http://127.0.0.1:8080.
#include <atomic>
#include <chrono>
#include <cstdlib>
#include <fstream>
#include <iostream>
#include <memory>
#include <mutex>
#include <sstream>
#include <string>
#include <thread>

#include "ConsoleCapture.h"
#include "GameManager.h"
#include "Json.h"
#include "httplib.h"

namespace {

std::string dataDir = "data";
std::string tutorialDir = "data_tutorial";
std::string webDir = "web";
const std::string savePath = "savegame.txt";
std::unique_ptr<GameManager> game;
std::mutex gameLock;
std::atomic<long long> lastPing(0);   // milliseconds clock of the last /api/ping (0 = page never opened)
long long nowMs() { return std::chrono::duration_cast<std::chrono::milliseconds>(std::chrono::steady_clock::now().time_since_epoch()).count(); }

bool newGame(const std::string& difficulty, bool tutorial = false) {
    std::unique_ptr<GameManager> g(new GameManager(tutorial ? tutorialDir : dataDir));
    if (!g->loadData()) return false;
    g->setPractice(tutorial);
    if (!difficulty.empty() && !g->setDifficulty(difficulty)) return false;
    game = std::move(g);
    return true;
}

std::string readFile(const std::string& path) {
    std::ifstream in(path);
    std::ostringstream s;
    s << in.rdbuf();
    return s.str();
}

// Everything the browser needs to draw the current moment of the game.
std::string stateJson() {
    const GameManager& g = *game;
    const Map& m = g.getMap();
    std::ostringstream o;
    o << "{\"title\":" << jstr(g.title()) << ",\"intro\":" << jstr(g.intro())
      << ",\"running\":" << jbool(g.isRunning()) << ",\"solved\":" << jbool(g.isSolved())
      << ",\"outcome\":" << jstr(g.getOutcome())
      << ",\"location\":" << g.currentLocation() << ",\"time\":" << jstr(g.clockText())
      << ",\"minutesLeft\":" << g.minutesLeft() << ",\"minutesTotal\":" << g.minutesTotal()
      << ",\"difficulty\":" << jstr(g.difficultyName()) << ",\"proofsNeeded\":" << g.proofsNeeded()
      << ",\"hintsLeft\":" << g.hintsLeft() << ",\"moves\":" << g.getPlayer().getMoves()
      << ",\"interrogations\":" << g.interrogations() << ",\"score\":" << g.score()
      << ",\"totalClues\":" << g.totalClues() << ",\"tutorial\":" << jbool(g.isPractice());

    o << ",\"locations\":[";
    for (int i = 0; i < m.size(); ++i) {
        const Location& l = m.getLocation(i);
        o << (i ? "," : "") << "{\"id\":" << i << ",\"name\":" << jstr(l.getName())
          << ",\"description\":" << jstr(l.getDescription()) << ",\"locked\":" << jbool(l.isLocked())
          << ",\"searched\":" << jbool(g.wasSearched(i)) << "}";
    }
    o << "],\"edges\":[";
    bool first = true;
    for (int a = 0; a < m.size(); ++a)
        for (int b : m.neighbours(a))
            if (a < b) {
                o << (first ? "" : ",") << "[" << a << "," << b << "," << m.walkingMinutes(a, b) << "]";
                first = false;
            }
    o << "],\"suspects\":[";
    const std::vector<Suspect>& sus = g.getSuspects();
    for (std::size_t i = 0; i < sus.size(); ++i) {
        const Suspect& s = sus[i];
        o << (i ? "," : "") << "{\"id\":" << s.getId() << ",\"name\":" << jstr(s.getName())
          << ",\"role\":" << jstr(s.getRole()) << ",\"motive\":" << jstr(s.getMotive())
          << ",\"alibi\":" << jstr(s.getAlibi()) << ",\"statement\":" << jstr(s.getStatement())
          << ",\"location\":" << s.getLocationId() << "}";
    }
    // Which clue a suspect is linked to is never sent: that would give the culprit away.
    o << "],\"journal\":[";
    const std::vector<Clue*>& j = g.getPlayer().getJournal();
    for (std::size_t i = 0; i < j.size(); ++i) {
        const Clue* c = j[i];
        o << (i ? "," : "") << "{\"id\":" << jstr(c->getId()) << ",\"name\":" << jstr(c->getName())
          << ",\"type\":" << jstr(c->getType()) << ",\"description\":" << jstr(c->getDescription())
          << ",\"importance\":" << c->getImportance() << ",\"location\":" << c->getLocationId() << "}";
    }
    o << "]}";
    return o.str();
}
void json(httplib::Response& res, const std::string& body) {
    res.set_content(body, "application/json; charset=utf-8");
}

#if defined(_WIN32)
// Edge and Chrome are normally not in PATH, so look in the folders they install to.
std::string findAppBrowser() {
    auto env = [](const char* name) { const char* v = std::getenv(name); return std::string(v ? v : ""); };
    const std::pair<std::string, std::string> places[] = {
        {env("ProgramFiles(x86)"), "\\Microsoft\\Edge\\Application\\msedge.exe"},
        {env("ProgramFiles"), "\\Microsoft\\Edge\\Application\\msedge.exe"},
        {env("ProgramFiles"), "\\Google\\Chrome\\Application\\chrome.exe"},
        {env("ProgramFiles(x86)"), "\\Google\\Chrome\\Application\\chrome.exe"},
        {env("LOCALAPPDATA"), "\\Google\\Chrome\\Application\\chrome.exe"}};
    for (const auto& p : places) {
        if (p.first.empty()) continue;
        std::string path = p.first + p.second;
        if (std::ifstream(path, std::ios::binary).good()) return path;
    }
    return "";
}
#endif

void openBrowser(const std::string& url) {
#if defined(_WIN32)
    // Open as a clean app-style window (Edge or Chrome, no address bar); fall back to the default browser.
    std::string exe = findAppBrowser();
    std::string c = exe.empty() ? "start \"\" \"" + url + "\"" : "start \"\" \"" + exe + "\" --app=" + url;
    if (std::system(c.c_str())) {}
#elif defined(__APPLE__)
    if (std::system(("open \"" + url + "\"").c_str())) {}
#else
    if (std::system(("xdg-open \"" + url + "\" >/dev/null 2>&1 &").c_str())) {}
#endif
}

}  // namespace

int main(int argc, char* argv[]) {
    bool openIt = true, autoClose = false;
    int arg = 0;
    for (int i = 1; i < argc; ++i) {
        std::string a = argv[i];
        if (a == "--no-browser") openIt = false;
        else if (a == "--auto-close") autoClose = true;
        else if (arg == 0) { dataDir = a; ++arg; }
        else if (arg == 1) { webDir = a; ++arg; }
    }
    if (!newGame("normal")) {
        std::cerr << "Could not load the game data from '" << dataDir
                  << "'. Run the program from the project folder.\n";
        return 1;
    }
    if (readFile(webDir + "/index.html").empty()) {
        std::cerr << "Could not find " << webDir << "/index.html. Run the program from the project folder.\n";
        return 1;
    }

    httplib::Server svr;
    svr.set_mount_point("/", webDir);
    svr.set_mount_point("/assets", "assets");   // optional real campus photos: assets/backgrounds/N.jpg
    svr.set_post_routing_handler([](const httplib::Request&, httplib::Response& res) {
        res.set_header("Cache-Control", "no-store");
    });


