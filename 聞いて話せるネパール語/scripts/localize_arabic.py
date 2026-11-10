"""Arabic uses the reviewed Korean pipeline, with separate masters and no paid API."""
import argparse
from localize_korean import assemble, prepare

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('--assemble', action='store_true')
    args = parser.parse_args()
    assemble('ar') if args.assemble else prepare('ar')
