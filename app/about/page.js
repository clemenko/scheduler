'use client';

import { Typography, Box, Link as MuiLink } from '@mui/material';

export default function AboutPage() {
  return (
    <Box sx={{ mt: 4 }}>
      <Typography variant="h4" gutterBottom>About</Typography>
      <Typography variant="body1" gutterBottom>
        Created by Andy Clemenko
      </Typography>
      <Typography variant="body1" gutterBottom>
        GitHub:{' '}
        <MuiLink href="https://github.com/clemenko/scheduler" target="_blank" rel="noopener">
          https://github.com/clemenko/scheduler
        </MuiLink>
      </Typography>
      <Typography variant="body1">
        Email:{' '}
        <MuiLink href="mailto:clemenko@wavfd.org">
          clemenko@wavfd.org
        </MuiLink>
      </Typography>
    </Box>
  );
}
