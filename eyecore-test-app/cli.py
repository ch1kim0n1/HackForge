#!/usr/bin/env python3
"""
eyecore-test-app
Testing EyeCore Python SDK functionality
"""

import click
from colorama import init, Fore, Style

init(autoreset=True)

@click.group()
@click.version_option(version='1.0.0')
def cli():
    """Testing EyeCore Python SDK functionality"""
    pass

@cli.command()
def hello():
    """Say hello"""
    click.echo(f"{Fore.CYAN}🔨 eyecore-test-app{Style.RESET_ALL}")
    click.echo(f"{config.projectDescription}")
    click.echo()
    click.echo("Use --help to see available commands")

@cli.command()
@click.argument('name')
def greet(name):
    """Greet someone by name"""
    click.echo(f"{Fore.GREEN}Hello, {name}! Welcome to eyecore-test-app{Style.RESET_ALL}")

@cli.command()
@click.option('--count', default=1, help='Number of times to repeat')
@click.argument('message')
def repeat(count, message):
    """Repeat a message N times"""
    for i in range(count):
        click.echo(f"{i+1}. {message}")

if __name__ == '__main__':
    cli()