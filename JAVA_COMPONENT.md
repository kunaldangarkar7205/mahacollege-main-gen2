# Java Component Added

A small Java component has been added without changing the existing website UI, authentication, Supabase database, theme system, responsive layout, favourites, prediction history, documents, notifications, or college data.

The class `java/CollegePredictionService.java` demonstrates the cutoff comparison used for college prediction:
- Student percentile >= college cutoff → eligible based on cutoff
- Student percentile < college cutoff → below current cutoff

This can be shown to the project guide as the Java portion of the project.
