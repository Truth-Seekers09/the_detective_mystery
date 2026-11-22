#ifndef JSON_H
#define JSON_H

#include <string>

// Tiny helpers for writing JSON by hand (the web front end reads it).
inline std::string jstr(const std::string& s) {
    std::string out = "\"";
    for (unsigned char c : s) {
        switch (c) {
            case '"':  out += "\\\""; break;
            case '\\': out += "\\\\"; break;
            case '\n': out += "\\n"; break;
            case '\r': out += "\\r"; break;
            case '\t': out += "\\t"; break;
            default:
                if (c < 0x20) {
                    const char* hex = "0123456789abcdef";
                    out += "\\u00";
                    out += hex[c >> 4];
                    out += hex[c & 15];
                } else {
                    out += static_cast<char>(c);     // UTF-8 bytes pass through
                }
        }
    }
    return out + "\"";
}

inline std::string jbool(bool b) { return b ? "true" : "false"; }

#endif
