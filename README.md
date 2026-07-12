# KDP MasterPeace

SaaS-Webanwendung zum Planen, Generieren, Prüfen, Reparieren und Exportieren
vollständiger Bücher und Workbooks (Amazon-KDP-nahe Publishing-Pipeline).

## Verbindliche Regeln

Die Datei `AGENTS.md` im Repository-Root ist die verbindliche technische
Projektverfassung. Sie ist vor jedem Arbeitsauftrag zu lesen.

## Branch-Modell

```
main                                    (Produktion – nur mit Pascals Freigabe)
└── staging                             (Integration / Preview)
    └── feature/<scope>                 (Arbeitsbranches)
```

## Hinweis zum Bootstrap

Das Remote-Repository war zum Zeitpunkt der Foundation-Phase leer.
`staging` wurde als Wurzelbranch initialisiert. Der Branch `main` wird
erst nach ausdrücklicher Freigabe durch Pascal angelegt bzw. befüllt
(siehe Abweichung DEV-001 in docs/reviews/foundation-implementation-report.md).
